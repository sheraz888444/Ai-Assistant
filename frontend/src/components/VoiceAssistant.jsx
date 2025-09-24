import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const VoiceAssistant = () => {
  const { user, logout } = useContext(AuthContext);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const finalBufferRef = useRef('');
  const [language, setLanguage] = useState('en-US');
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const navigate = useNavigate();

  // Introduction effect: Introduce once when user data is available
  useEffect(() => {
    if (user?.assistantName && user?.name && !hasIntroduced && selectedVoice) {
      const introMessage = `Hello, I am ${user.assistantName}. How can I help you ${user.name}?`;
      speak(introMessage);
      setHasIntroduced(true);
    }
  }, [user?.assistantName, user?.name, hasIntroduced, selectedVoice]);

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language || 'en-US';
    setLanguage(browserLang);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech Recognition API not supported in this browser');
        return;
      }
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = language;

      recog.onresult = (event) => {
        let interim = '';
        let final = '';
        const start = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
        for (let i = start; i < event.results.length; i++) {
          const res = event.results[i];
          const text = (res[0]?.transcript || '');
          if (res.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }
        // Accumulate finalized chunks for whole-instruction execution
        if (final) {
          finalBufferRef.current = `${(finalBufferRef.current || '').trim()} ${final}`.trim();
          // Process immediately for faster response
          checkForCommand(finalBufferRef.current);
          finalBufferRef.current = '';
        }
        // Show interim while speaking; else show what we have finalized
        setTranscript(interim || finalBufferRef.current);
      };

      recog.onerror = (event) => {
        if (event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        }
        // 'aborted' is normal, no need to log or stop
      };

      recog.onend = () => {
        // When engine pauses (silence or boundary), treat buffered final as the whole instruction
        const finalText = (finalBufferRef.current || '').trim();
        if (finalText) {
          checkForCommand(finalText);
          finalBufferRef.current = '';
        }
        if (isListening) {
          recog.start();
        }
      };

      recognitionRef.current = recog;
    } catch (e) {
      console.error('SpeechRecognition init failed', e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, isListening]);

  // Select voice based on assistant name
  useEffect(() => {
    const selectVoice = () => {
      if ('speechSynthesis' in window && user?.assistantName) {
        const voices = window.speechSynthesis.getVoices();
        const assistantName = user.assistantName.toLowerCase();
        const isFemale = isFemaleName(assistantName);
        let selected = null;

        // Prefer female voices for female names
        if (isFemale) {
          selected = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman') || voice.name.toLowerCase().includes('girl')) ||
                     voices.find(voice => voice.name.toLowerCase().includes('zira') || voice.name.toLowerCase().includes('hazel') || voice.name.toLowerCase().includes('susan'));
        }

        // Fallback to any English voice
        if (!selected) {
          selected = voices.find(voice => voice.lang.startsWith('en'));
        }

        // Fallback to first available voice
        if (!selected && voices.length > 0) {
          selected = voices[0];
        }

        setSelectedVoice(selected);
      }
    };

    selectVoice();
    // Listen for voices to be loaded
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }, [user?.assistantName]);

  // Function to detect if name is female
  const isFemaleName = (name) => {
    const femaleEndings = ['a', 'i', 'e', 'y'];
    const femaleNames = ['alice', 'anna', 'bella', 'catherine', 'diana', 'elizabeth', 'fiona', 'grace', 'hannah', 'iris', 'julia', 'kate', 'lily', 'maria', 'nina', 'olivia', 'penny', 'quinn', 'rose', 'sara', 'tina', 'uma', 'violet', 'wendy', 'xena', 'yara', 'zara'];
    const lowerName = name.toLowerCase();
    return femaleNames.includes(lowerName) || femaleEndings.some(ending => lowerName.endsWith(ending));
  };

  // Local robust command executor (fallback and speedy path)
  const executeCommand = async (raw) => {
    const t = (raw || '').trim();
    let response = '';
    let executed = false;

    // Open/navigate commands (URLs or site words)
    const openMatch = t.match(/^(open|go to|navigate to)\s+(.+)/);
    if (openMatch) {
      let target = openMatch[2].trim();
      target = target.replace(/^the\s+/, '').replace(/\s+website$|\s+site$/,'').trim();
      if (/^https?:\/\//.test(target)) {
        window.open(target, '_blank');
      } else if (target.includes('.')) {
        window.open(`https://${target}`, '_blank');
      } else {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(target)}`, '_blank');
      }
      response = `Opening ${target}`;
      executed = true;
      return { response, executed };
    }

    // YouTube search
    const ytMatch = t.match(/^(youtube|open youtube( and)? search)\s+(.+)/);
    if (ytMatch) {
      const q = ytMatch[3] || t.replace(/^(youtube)\s+/, '').trim();
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
      response = `Searching YouTube for ${q}`;
      executed = true;
      return { response, executed };
    }

    // Google search
    const searchMatch = t.match(/^(search|google)\s+(.+)/) || t.match(/^search google for\s+(.+)/);
    if (searchMatch) {
      const q = searchMatch[2] || searchMatch[1];
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
      response = `Searching Google for ${q}`;
      executed = true;
      return { response, executed };
    }

    // Shortcuts
    if (/^open facebook$/.test(t)) { window.open('https://www.facebook.com', '_blank'); response = 'Opening Facebook'; executed = true; return { response, executed }; }
    if (/^open gmail$/.test(t)) { window.open('https://mail.google.com', '_blank'); response = 'Opening Gmail'; executed = true; return { response, executed }; }
    if (/^open github$/.test(t)) { window.open('https://github.com', '_blank'); response = 'Opening GitHub'; executed = true; return { response, executed }; }
    if (/^open youtube$/.test(t) || /^go to youtube$/.test(t)) { window.open('https://www.youtube.com', '_blank'); response = 'Opening YouTube'; executed = true; return { response, executed }; }

    // Internal navigation (app routes)
    {
      const routeMatch = t.match(/^((open|go to|navigate to)\s+)?(dashboard|home|homepage|login|setup|customize|customise|settings?)$/);
      if (routeMatch) {
        const dest = routeMatch[3];
        const map = {
          dashboard: '/dashboard',
          home: '/',
          homepage: '/',
          login: '/login',
          setup: '/setup',
          customize: '/setup',
          customise: '/setup',
          settings: '/dashboard'
        };
        const path = map[dest] || '/';
        navigate(path);
        response = `Navigating to ${dest}`;
        executed = true;
        return { response, executed };
      }
    }

    // Logout
    if (/^log ?out$/.test(t)) {
      try { await logout(); } catch {}
      navigate('/login');
      response = 'Logging out';
      executed = true;
      return { response, executed };
    }

    // Listening control
    if (/^stop listening$/.test(t)) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      response = 'Stopped listening';
      executed = true;
      return { response, executed };
    }
    if (/^start listening$/.test(t)) {
      if (recognitionRef.current) recognitionRef.current.start();
      setIsListening(true);
      response = 'Started listening';
      executed = true;
      return { response, executed };
    }

    // Clipboard
    {
      const copyMatch = t.match(/^copy\s+(.+)/);
      if (copyMatch && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(copyMatch[1]);
          response = 'Copied to clipboard';
        } catch {
          response = 'Failed to copy to clipboard';
        }
        executed = true;
        return { response, executed };
      }
    }

    // Page control
    if (/^scroll down$/.test(t)) { window.scrollBy({ top: window.innerHeight, behavior: 'smooth' }); response = 'Scrolling down'; executed = true; return { response, executed }; }
    if (/^scroll up$/.test(t)) { window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' }); response = 'Scrolling up'; executed = true; return { response, executed }; }
    if (/^scroll to top$/.test(t)) { window.scrollTo({ top: 0, behavior: 'smooth' }); response = 'Scrolling to top'; executed = true; return { response, executed }; }
    if (/^scroll to bottom$/.test(t)) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); response = 'Scrolling to bottom'; executed = true; return { response, executed }; }

    if (/^(reload|refresh)( the)? page$/.test(t) || /^(reload|refresh)$/.test(t)) { window.location.reload(); response = 'Reloading the page'; executed = true; return { response, executed }; }
    if (/^go back$/.test(t)) { window.history.back(); response = 'Going back'; executed = true; return { response, executed }; }
    if (/^go forward$/.test(t)) { window.history.forward(); response = 'Going forward'; executed = true; return { response, executed }; }

    // Speak arbitrary text
    const sayMatch = t.match(/^say\s+(.+)/);
    if (sayMatch) { response = sayMatch[1]; executed = true; return { response, executed }; }

    // Time and date
    if (/^(what('s| is) )?(the )?time/.test(t)) { response = `The time is ${new Date().toLocaleTimeString()}`; executed = true; return { response, executed }; }
    if (/^(what('s| is) )?(the )?date/.test(t)) { response = `Today's date is ${new Date().toLocaleDateString()}`; executed = true; return { response, executed }; }

    // Fallback: treat as a random command – search the web
    window.open(`https://www.google.com/search?q=${encodeURIComponent(t)}`, '_blank');
    response = `Searching the web for "${t}".`;
    executed = true;
    return { response, executed };
  };

  // AI interpretation helpers (optional, uses backend LLM if configured)
  const interpretWithAI = async (raw) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/interpret`,
        { text: raw, locale: language },
        { withCredentials: true }
      );
      return res.data;
    } catch {
      return null;
    }
  };

  const performStructuredAction = async (parsed) => {
    let response = '';
    const a = parsed?.action;
    const args = parsed?.args || {};

    switch (a) {
      case 'open_search': {
        const engine = (args.engine || 'google').toLowerCase();
        const q = args.query || '';
        if (engine === 'youtube') {
          window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
          response = `Searching YouTube for ${q}`;
        } else {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
          response = `Searching Google for ${q}`;
        }
        return { response, executed: true };
      }
      case 'open_url': {
        const url = args.url;
        if (url) {
          window.open(url, '_blank');
          response = `Opening ${url}`;
          return { response, executed: true };
        }
        break;
      }
      case 'open_site': {
        if (args.site) {
          const map = {
            facebook: 'https://www.facebook.com',
            gmail: 'https://mail.google.com',
            github: 'https://github.com',
            youtube: 'https://www.youtube.com'
          };
          const siteKey = String(args.site).toLowerCase();
          const url = map[siteKey] || `https://www.google.com/search?q=${encodeURIComponent(args.site)}`;
          window.open(url, '_blank');
          response = `Opening ${args.site}`;
          return { response, executed: true };
        }
        break;
      }
      case 'navigate': {
        if (args.path) {
          navigate(args.path);
          response = `Navigating to ${args.path}`;
          return { response, executed: true };
        }
        break;
      }
      case 'scroll': {
        const dir = (args.direction || '').toLowerCase();
        if (dir === 'down') window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        else if (dir === 'up') window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        else if (dir === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (dir === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        response = 'Scrolling';
        return { response, executed: true };
      }
      case 'reload': {
        window.location.reload();
        response = 'Reloading the page';
        return { response, executed: true };
      }
      case 'history': {
        const dir = (args.direction || '').toLowerCase();
        if (dir === 'back') window.history.back();
        else if (dir === 'forward') window.history.forward();
        response = `Going ${dir}`;
        return { response, executed: true };
      }
      case 'say': {
        response = args.text || '';
        return { response, executed: true };
      }
      case 'time': {
        response = `The time is ${new Date().toLocaleTimeString()}`;
        return { response, executed: true };
      }
      case 'date': {
        response = `Today's date is ${new Date().toLocaleDateString()}`;
        return { response, executed: true };
      }
      default:
        return { response: '', executed: false };
    }
  };

  // Accept named or natural commands; prefer AI parsing, fallback to local patterns
  const checkForCommand = async (text) => {
    if (isProcessing) return;

    const lowerText = (text || '').toLowerCase().trim();
    const assistantName = (user?.assistantName || '').toLowerCase().trim();

    // Try to extract command after assistant name at the start
    let commandText = lowerText;
    let triggered = false;

    if (assistantName) {
      const escaped = assistantName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameAtStart = new RegExp(`^${escaped}[:,]?\\s+(.+)$`);
      const match = lowerText.match(nameAtStart);
      if (match) {
        commandText = match[1].trim();
        triggered = true;
      }
    }

    // Also allow common imperative patterns (natural usage)
    const generalPatterns = [
      /^(open|go to|navigate to)\s+.+/,
      /^(search|google)\s+.+/,
      /^youtube\s+.+/,
      /^(scroll (down|up|to (top|bottom)))/,
      /^(reload|refresh)( the)? page$/,
      /^go (back|forward)$/,
      /^say\s+.+/,
      /^(what('s| is) )?(the )?(time|date)/,
      /^who are you$/,
      /^what is your name$/,
      /^introduce yourself$/,
      /^tell me about yourself$/
    ];
    if (!triggered && generalPatterns.some(re => re.test(lowerText))) {
      triggered = true;
      commandText = lowerText;
    }

    if (!triggered) return;
    if (!commandText) return;

    setIsProcessing(true);

    // Prefer AI parsing first
    let executed = false;
    let response = '';

    try {
      const ai = await interpretWithAI(commandText);
      if (ai?.ok && ai.parsed?.action) {
        const r = await performStructuredAction(ai.parsed);
        executed = r.executed;
        response = r.response || '';
      }
    } catch {}

    // Fallback to local patterns
    if (!executed) {
      // For common chat questions, call backend chat API
      if (/^(who are you|what is your name|introduce yourself|tell me about yourself)$/.test(commandText)) {
        try {
          const chatRes = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/chat`,
            { message: commandText, locale: language },
            { withCredentials: true }
          );
          if (chatRes.data?.response) {
            response = chatRes.data.response;
            executed = true;
          }
        } catch (e) {
          console.error('Error calling chat API:', e);
        }
      }
      if (!executed) {
        const r2 = await executeCommand(commandText);
        executed = r2.executed;
        response = r2.response || response;
      }
    }

    if (executed) {
      speak(response);
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/user/command-history`,
          { command: text, response },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error logging command:', error);
      }
    }

    setIsProcessing(false);
    setTranscript('');
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="voice-assistant">
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`microphone-button ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}
        title={isListening ? 'Stop listening' : 'Start listening'}
      >
        <div className="microphone-icon">
          {isProcessing ? (
            <div className="processing-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          ) : (
            <svg
              className="mic-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </div>
        {transcript && (
          <div className="transcript">
            {transcript}
          </div>
        )}
      </button>

      <style>{`
        .voice-assistant {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .microphone-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          position: relative;
        }

        .microphone-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .microphone-button.listening {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          animation: pulse 1.5s infinite;
        }

        .microphone-button.processing {
          background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
        }

        .microphone-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mic-svg {
          width: 24px;
          height: 24px;
        }

        .processing-animation {
          display: flex;
          gap: 4px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: white;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        .transcript {
          position: absolute;
          bottom: 70px;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 220px;
          font-size: 12px;
          backdrop-filter: blur(10px);
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default VoiceAssistant;
