import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext.jsx';

// Default code words — require 2 repetitions within 5s
const DEFAULT_CODEWORDS = ['activate emergency now', 'sos code red', 'start safety mode'];

// Layer 3 keywords + context patterns
const LAYER3_KEYWORDS = ['help', 'bachao', 'madad karo', 'save me', 'danger', 'mujhe bachao', 'i am in danger'];
const LAYER3_CONTEXT = ['help me please', 'mujhe bachao', 'i am in danger', 'please help', 'koi hai', 'bachao mujhe', 'help help', 'danger danger'];

// Confidence scoring
function scoreTranscript(text) {
  let score = 0;
  const lower = text.toLowerCase();

  // Keyword match
  if (LAYER3_KEYWORDS.some(kw => lower.includes(kw))) score += 30;
  // Context match (stronger phrases)
  if (LAYER3_CONTEXT.some(ctx => lower.includes(ctx))) score += 25;
  // False positive filter: ignore common non-emergency uses
  const falsePositives = ['helped', 'helping', 'emergency meeting', 'emergency exit', 'help yourself'];
  if (falsePositives.some(fp => lower.includes(fp))) score -= 40;

  return score;
}

// Fuzzy match: returns similarity ratio 0-1
function fuzzyMatch(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  // Simple word overlap
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

export default function VoiceActivation() {
  const navigate = useNavigate();
  const { voiceActivation, voiceCodeword, voiceMode = 'safe' } = useAppContext();
  const [listening, setListening] = useState(false);
  const [detected, setDetected] = useState(false);
  const [status, setStatus] = useState(''); // 'first_hit', 'triggered'

  const recognitionRef = useRef(null);
  const recentPhrases = useRef([]); // { text, time }
  const restartRef = useRef(null);
  const triggerCooldown = useRef(false);

  const triggerSOS = useCallback(() => {
    if (triggerCooldown.current) return;
    triggerCooldown.current = true;
    setDetected(true);
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    setTimeout(() => navigate('/sos'), 600);
  }, [navigate]);

  const analyzeTranscript = useCallback((transcript) => {
    const lower = transcript.toLowerCase().trim();
    const now = Date.now();

    // === LAYER 1: User-defined custom codeword (instant trigger) ===
    if (voiceCodeword && voiceCodeword.trim().length > 2) {
      const sim = fuzzyMatch(lower, voiceCodeword.trim());
      if (sim >= 0.85) {
        triggerSOS();
        return;
      }
    }

    // === LAYER 2: Default codewords (require 2 repetitions within 5s) ===
    const matchedDefault = DEFAULT_CODEWORDS.find(cw => fuzzyMatch(lower, cw) >= 0.85);
    if (matchedDefault) {
      recentPhrases.current.push({ text: matchedDefault, time: now, type: 'default' });
      // Clean old entries
      recentPhrases.current = recentPhrases.current.filter(p => now - p.time < 5000);
      const defaultHits = recentPhrases.current.filter(p => p.type === 'default' && p.text === matchedDefault);
      if (defaultHits.length >= 2) {
        triggerSOS();
        return;
      } else {
        setStatus('first_hit');
        if (navigator.vibrate) navigator.vibrate(100);
        return;
      }
    }

    // === LAYER 3: Smart keyword + context scoring ===
    let score = scoreTranscript(lower);

    // Repetition bonus: if similar phrase was said recently
    recentPhrases.current = recentPhrases.current.filter(p => now - p.time < 5000);
    const recentKeyword = recentPhrases.current.find(p => p.type === 'keyword');
    if (recentKeyword) score += 25; // Repetition bonus

    if (LAYER3_KEYWORDS.some(kw => lower.includes(kw))) {
      recentPhrases.current.push({ text: lower, time: now, type: 'keyword' });
    }

    // Failsafe: medium confidence (50-70) → start background recording, don't trigger
    if (score >= 50 && score < 70) {
      setStatus('first_hit'); // Visual indicator only
      return;
    }

    // High confidence: trigger SOS
    if (score >= 70) {
      // In 'safe' mode require confirmation (2nd detection), in 'fast' trigger immediately
      if (voiceMode === 'fast') {
        triggerSOS();
      } else {
        const prevHighScore = recentPhrases.current.find(p => p.type === 'high_score');
        if (prevHighScore) {
          triggerSOS();
        } else {
          recentPhrases.current.push({ text: lower, time: now, type: 'high_score' });
          setStatus('first_hit');
          if (navigator.vibrate) navigator.vibrate(100);
        }
      }
    }
  }, [voiceCodeword, voiceMode, triggerSOS]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;       // NEVER stop listening
      recognition.interimResults = true;   // Process partial results
      recognition.lang = 'en-IN';
      recognition.maxAlternatives = 3;
      recognitionRef.current = recognition;

      recognition.onstart = () => setListening(true);

      recognition.onresult = (event) => {
        // Process last few results
        const results = Array.from(event.results).slice(-4);
        const transcript = results.map(r => r[0].transcript).join(' ');
        analyzeTranscript(transcript);
      };

      recognition.onend = () => {
        setListening(false);
        // Auto-restart — NEVER timeout
        if (voiceActivation && !triggerCooldown.current) {
          clearTimeout(restartRef.current);
          restartRef.current = setTimeout(() => {
            startListening();
          }, 800);
        }
      };

      recognition.onerror = (e) => {
        setListening(false);
        if (e.error !== 'aborted' && voiceActivation) {
          clearTimeout(restartRef.current);
          restartRef.current = setTimeout(() => startListening(), 1500);
        }
      };

      recognition.start();
    } catch {}
  }, [voiceActivation, analyzeTranscript]);

  useEffect(() => {
    if (!voiceActivation) {
      recognitionRef.current?.stop();
      clearTimeout(restartRef.current);
      setListening(false);
      setDetected(false);
      setStatus('');
      return;
    }

    startListening();

    return () => {
      recognitionRef.current?.stop();
      clearTimeout(restartRef.current);
    };
  }, [voiceActivation, startListening]);

  if (!voiceActivation) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold shadow-lg transition-all ${
      detected ? 'animate-pulse' :
      status === 'first_hit' ? '' : ''
    }`}
    style={detected
      ? { background: 'rgba(239,68,68,0.9)', color: 'white' }
      : status === 'first_hit'
      ? { background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)', color: '#F59E0B' }
      : listening
      ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }
      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280' }
    }>
      {listening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
      {detected ? '🚨 SOS!' : status === 'first_hit' ? '⚠ Detected' : listening ? 'Listening' : 'Voice off'}
    </div>
  );
}