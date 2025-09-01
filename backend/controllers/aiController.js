import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

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

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_APIKEY;
    const googleApiModel = 'models/chat-bison-001';

    if (!openaiApiKey && !googleApiKey) {
      // Fallback regex-based parsing when no API key is configured
      const parsed = fallbackParse(text);
      return res.status(200).json({ ok: true, parsed, raw: { engine: 'fallback' } });
    }

    let parsed = null;
    let raw = {};

    if (openaiApiKey) {
      const client = new OpenAI({ apiKey: openaiApiKey });

      const system = `
You are a command interpreter that converts natural language into a structured JSON action for a web-based assistant.
Only return a single JSON object. Do not include extra text.

Supported actions:
- "open_search": { "engine": "google" | "youtube", "query": string }
- "open_url": { "url": string }
- "open_site": { "site": string }  // e.g. "facebook", "gmail", "github", "youtube"
- "navigate": { "path": "/dashboard" | "/login" | "/setup" | "/" }
- "scroll": { "direction": "down" | "up" | "top" | "bottom" }
- "reload": {}
- "history": { "direction": "back" | "forward" }
- "say": { "text": string }
- "time": {}
- "date": {}

Rules:
- For commands like "open youtube and search for X" or "youtube search X", use open_search with engine "youtube".
- For commands like "open youtube" or "go to youtube", use open_site with site "youtube".
- For "open facebook", "open gmail", "open github", use open_site with canonical name.
- For "open example.com" or any domain-like token, use open_url with https scheme.
- For "go to dashboard/home/login/setup", use navigate accordingly.
- For local file or folder navigation (e.g., "go to downloads folder", "open C:\folder"), return {"action":"say","text":"I cannot access local files or folders from the browser."}
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
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { action: 'open_search', args: { engine: 'google', query: text } };
      }
      raw = { engine: 'openai', model: 'gpt-4o-mini' };
    } else if (googleApiKey) {
      // Use Google Gemini API
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
You are a command interpreter that converts natural language into a structured JSON action for a web-based assistant.
Only return a single JSON object. Do not include extra text.

Supported actions:
- "open_search": { "engine": "google" | "youtube", "query": string }
- "open_url": { "url": string }
- "open_site": { "site": string }  // e.g. "facebook", "gmail", "github", "youtube"
- "navigate": { "path": "/dashboard" | "/login" | "/setup" | "/" }
- "scroll": { "direction": "down" | "up" | "top" | "bottom" }
- "reload": {}
- "history": { "direction": "back" | "forward" }
- "say": { "text": string }
- "time": {}
- "date": {}

Rules:
- For commands like "open youtube and search for X" or "youtube search X", use open_search with engine "youtube".
- For commands like "open youtube" or "go to youtube", use open_site with site "youtube".
- For "open facebook", "open gmail", "open github", use open_site with canonical name.
- For "open example.com" or any domain-like token, use open_url with https scheme.
- For "go to dashboard/home/login/setup", use navigate accordingly.
- For local file or folder navigation (e.g., "go to downloads folder", "open C:\folder"), return {"action":"say","text":"I cannot access local files or folders from the browser."}
- If you cannot understand, default to {"action":"open_search","engine":"google","query": <original text>}

User locale: ${locale}
Text: ${text}

Return ONLY a JSON object with fields { "action": string, "args": object }.
`;

      const result = await model.generateContent(prompt, {
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const response = await result.response;
      const content = response.text();
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = { action: 'open_search', args: { engine: 'google', query: text } };
      }
      raw = { engine: 'gemini', model: 'gemini-1.5-flash' };
    }

    // Minimal validation
    if (!parsed || typeof parsed !== 'object' || !parsed.action) {
      parsed = { action: 'open_search', args: { engine: 'google', query: text } };
    }

    return res.status(200).json({
      ok: true,
      parsed,
      raw
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

  // youtube search with query
  if (/^(youtube|open youtube( and)? search)\s+/.test(t)) {
    const q = t.replace(/^(youtube|open youtube( and)? search)\s+/, '').trim();
    return { action: 'open_search', args: { engine: 'youtube', query: q } };
  }

  // google search
  if (/^search google for\s+/.test(t) || /^google\s+/.test(t) || /^search\s+/.test(t)) {
    const q = t.replace(/^(search google for|google|search)\s+/, '').trim();
    return { action: 'open_search', args: { engine: 'google', query: q } };
  }

  // site shortcuts without search
  if (/^open youtube$/.test(t) || /^go to youtube$/.test(t)) return { action: 'open_site', args: { site: 'youtube' } };
  if (/^open facebook$/.test(t) || /^go to facebook$/.test(t)) return { action: 'open_site', args: { site: 'facebook' } };
  if (/^open gmail$/.test(t) || /^go to gmail$/.test(t)) return { action: 'open_site', args: { site: 'gmail' } };
  if (/^open github$/.test(t) || /^go to github$/.test(t)) return { action: 'open_site', args: { site: 'github' } };

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

  // disallow local files/folders
  if (/go to .*folder|open .*folder|go to .*directory|open .*directory|open .*[\\\/]|go to .*[\\\/]/.test(t) || /downloads|documents|desktop|pictures|music|videos/.test(t) && /folder|directory/.test(t)) {
    return { action: 'say', args: { text: 'I cannot access local files or folders from the browser.' } };
  }

  // default
  return { action: 'open_search', args: { engine: 'google', query: raw } };
}

/**
 * POST /api/ai/chat
 * Body: { message: string, locale?: string }
 * Returns: { response: string }
 *
 * Uses OpenAI or Google Gemini for general chat responses to common questions.
 */
export const generalChat = async (req, res) => {
  try {
    const { message = '', locale = 'en-US' } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || process.env.OPENAI_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_APIKEY;

    if (!openaiApiKey && !googleApiKey) {
      return res.status(500).json({ error: 'No API key configured for OpenAI or Google Gemini' });
    }

    let response = '';

    if (openaiApiKey) {
      const client = new OpenAI({ apiKey: openaiApiKey });

      const system = `
You are a helpful AI assistant. Respond to the user's message in a friendly and informative way.
Keep responses concise but complete. If the message is a question, answer it directly.
If it's a statement, acknowledge it appropriately.
Do not mention that you are an AI unless asked.
`;

      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      response = completion.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } else if (googleApiKey) {
      // Use Google Gemini API
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
You are a helpful AI assistant. Respond to the user's message in a friendly and informative way.
Keep responses concise but complete. If the message is a question, answer it directly.
If it's a statement, acknowledge it appropriately.
Do not mention that you are an AI unless asked.

User message: ${message}
`;

      const result = await model.generateContent(prompt, {
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        },
      });

      const geminiResponse = await result.response;
      response = geminiResponse.text() || 'Sorry, I could not generate a response.';
    }

    return res.status(200).json({ response });
  } catch (err) {
    console.error('generalChat error:', err);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
};
