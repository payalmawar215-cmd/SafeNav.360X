import { useEffect, useRef, useCallback } from 'react';

const COOLDOWN_MS = 90 * 1000; // 90s between same-zone alerts

export default function VoiceGuide({ enabled, language = 'en-IN', instruction, riskAlert, routeType }) {
  const lastSpokenRef = useRef({});
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speak = useCallback((text, priority = 'normal') => {
    if (!enabled || !synth) return;
    const key = text.slice(0, 30);
    const now = Date.now();
    if (lastSpokenRef.current[key] && now - lastSpokenRef.current[key] < COOLDOWN_MS && priority !== 'critical') return;
    lastSpokenRef.current[key] = now;

    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = language;
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.volume = 1;
    synth.speak(utt);
  }, [enabled, synth, language]);

  // Speak navigation instructions
  useEffect(() => {
    if (!instruction) return;
    speak(instruction);
  }, [instruction, speak]);

  // Speak risk alerts — only HIGH/CRITICAL
  useEffect(() => {
    if (!riskAlert) return;
    const { level, message } = riskAlert;
    if (level === 'CRITICAL') speak(message, 'critical');
    else if (level === 'HIGH') speak(message);
    // MEDIUM/LOW → silent
  }, [riskAlert, speak]);

  // Announce route start
  useEffect(() => {
    if (routeType) {
      const msg = routeType === 'safest'
        ? 'Starting navigation on the safest route. Stay alert.'
        : routeType === 'balanced'
          ? 'Starting navigation on balanced route.'
          : 'Starting navigation. Drive carefully.';
      speak(msg);
    }
  }, [routeType, speak]);

  return null;
}