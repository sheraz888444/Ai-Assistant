import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

/**
 * POST /api/ai/interpret
 * Body: { text: string, locale?: string }
 * Returns: { ok: boolean, parsed?: { action: string, args?: any }, raw?: any }
 * 
 * If OPENAI_API_KEY is present, uses LLM to parse free-form commands into structured actions.
 * Otherwise falls back to lightweight regex parsing.
 */
export const interpretCommand = async (req, res) => {
  try {
    const { text = '', locale = 'en-US' } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ ok: false, error: 'text is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_KEY;
    if (!apiKey) {
      // Fallback regex-based parsing when no API key is configured
      const parsed = fallbackParse(text);
      return res.status(200).json({ ok: true, parsed, raw: { engine: 'fallback' } });
    }

    const client = new OpenAI({ apiKey });

    const system = `
You are a command interpreter that converts natural language into a structured JSON action for a web-based assistant.
Only return a single JSON object. Do not include extra text.

Supported actions:
- "open_search": { "engine": "google" | "youtube", "query": string }
- "open_url": { "url": string }
- "open_site": { "site": string }  // e.g. "facebook", "gmail", "github"
- "navigate": { "path": "/dashboard" | "/login" | "/setup" | "/" }
- "scroll": { "direction": "down" | "up" | "top" | "bottom" }
- "reload": {}
- "history": { "direction": "back" | "forward" }
- "say": { "text": string }
- "time": {}
- "date": {}

Rules:
- For "open ... and search ...", pick engine youtube or google based on text.
- For "open example.com" or any domain-like token, use open_url with https scheme.
- For "open facebook", "open gmail", "open github", use open_site with canonical name.
- For "go to dashboard/home/login/setup", use navigate accordingly.
- If impossible (like opening local OS files), return {"action":"say","text":"I cannot access local files from the browser."}
- If you cannot understand, default to {"action":"open_search","engine":"google","query": <original text>}
`;

    const userPrompt = `
User locale: ${locale}
Text: ${text}

Return ONLY a JSON object with fields { "action": string, "args": object }.
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { action: 'open_search', args: { engine: 'google', query: text } };
    }

    // Minimal validation
    if (!parsed || typeof parsed !== 'object' || !parsed.action) {
      parsed = { action: 'open_search', args: { engine: 'google', query: text } };
    }

    return res.status(200).json({
      ok: true,
      parsed,
      raw: { engine: 'openai', model: 'gpt-4o-mini' }
    });
  } catch (err) {
    console.error('interpretCommand error:', err);
    // Fallback to regex parse on error
    const parsed = fallbackParse(req.body?.text || '');
    return res.status(200).json({ ok: true, parsed, raw: { engine: 'error-fallback' } });
  }
};

function fallbackParse(raw) {
  const t = String(raw || '').trim().toLowerCase();

  // youtube search
  if (/^(youtube|open youtube( and)? search)\s+/.test(t)) {
    const q = t.replace(/^(youtube|open youtube( and)? search)\s+/, '').trim();
    return { action: 'open_search', args: { engine: 'youtube', query: q } };
  }

  // google search
  if (/^search google for\s+/.test(t) || /^google\s+/.test(t) || /^search\s+/.test(t)) {
    const q = t.replace(/^(search google for|google|search)\s+/, '').trim();
    return { action: 'open_search', args: { engine: 'google', query: q } };
  }

  // site shortcuts
  if (/^open facebook$/.test(t)) return { action: 'open_site', args: { site: 'facebook' } };
  if (/^open gmail$/.test(t)) return { action: 'open_site', args: { site: 'gmail' } };
  if (/^open github$/.test(t)) return { action: 'open_site', args: { site: 'github' } };

  // navigate
  if (/^(open|go to|navigate to)\s+(dashboard|home|homepage|login|setup|customize|customise|settings?)$/.test(t)) {
    const dest = t.replace(/^(open|go to|navigate to)\s+/, '').trim();
    const map = { dashboard: '/dashboard', home: '/', homepage: '/', login: '/login', setup: '/setup', customize: '/setup', customise: '/setup', settings: '/dashboard' };
    return { action: 'navigate', args: { path: map[dest] || '/' } };
  }

  // open url
  const urlMatch = t.match(/^open\s+([^\s]+)$/);
  if (urlMatch) {
    let url = urlMatch[1];
    if (!/^https?:\/\//.test(url) && url.includes('.')) {
      url = `https://${url}`;
    }
    return { action: 'open_url', args: { url } };
  }

  // scroll
  if (/^scroll down$/.test(t)) return { action: 'scroll', args: { direction: 'down' } };
  if (/^scroll up$/.test(t)) return { action: 'scroll', args: { direction: 'up' } };
  if (/^scroll to top$/.test(t)) return { action: 'scroll', args: { direction: 'top' } };
  if (/^scroll to bottom$/.test(t)) return { action: 'scroll', args: { direction: 'bottom' } };

  // reload / history
  if (/^(reload|refresh)( the)? page$/.test(t) || /^(reload|refresh)$/.test(t)) return { action: 'reload', args: {} };
  if (/^go back$/.test(t)) return { action: 'history', args: { direction: 'back' } };
  if (/^go forward$/.test(t)) return { action: 'history', args: { direction: 'forward' } };

  // say
  const say = t.match(/^say\s+(.+)/);
  if (say) return { action: 'say', args: { text: say[1] } };

  // time/date
  if (/(what('s| is) )?(the )?time/.test(t)) return { action: 'time', args: {} };
  if (/(what('s| is) )?(the )?date/.test(t)) return { action: 'date', args: {} };

  // disallow local files
  if (/open .*documents|open .*document|open .*file/.test(t)) {
    return { action: 'say', args: { text: 'I cannot access local files from the browser.' } };
  }

  // default
  return { action: 'open_search', args: { engine: 'google', query: raw } };
}