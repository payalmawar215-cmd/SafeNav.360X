import { useEffect, useRef, useCallback } from 'react';

// STRICT: exactly 2 strong shakes within 2 seconds = SOS trigger
// Strong shake threshold (ignores walking/minor movement)
const SHAKE_THRESHOLD = 18; // m/s² — only very strong shakes
const SHAKE_WINDOW_MS = 2000;
const REQUIRED_SHAKES = 2;

export function useShakeSOS({ enabled, onFirstShake, onTrigger }) {
  const shakesRef = useRef([]);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const cooldownRef = useRef(false);

  const handleMotion = useCallback((event) => {
    if (!enabled || cooldownRef.current) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const { x = 0, y = 0, z = 0 } = acc;
    const prev = lastAccelRef.current;

    // Delta magnitude
    const deltaX = Math.abs(x - prev.x);
    const deltaY = Math.abs(y - prev.y);
    const deltaZ = Math.abs(z - prev.z);
    const delta = deltaX + deltaY + deltaZ;

    lastAccelRef.current = { x, y, z };

    if (delta > SHAKE_THRESHOLD) {
      const now = Date.now();

      // Prune shakes outside window
      shakesRef.current = shakesRef.current.filter(t => now - t < SHAKE_WINDOW_MS);

      // Debounce: ignore if last shake was < 300ms ago
      const lastShake = shakesRef.current[shakesRef.current.length - 1];
      if (lastShake && now - lastShake < 300) return;

      shakesRef.current.push(now);

      const count = shakesRef.current.length;

      if (count === 1) {
        // First shake — haptic feedback
        if (navigator.vibrate) navigator.vibrate(80);
        if (onFirstShake) onFirstShake();
      }

      if (count >= REQUIRED_SHAKES) {
        // Second shake within window — TRIGGER SOS
        shakesRef.current = [];
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 5000); // 5s cooldown

        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]); // Strong feedback
        if (onTrigger) onTrigger();
      }
    }
  }, [enabled, onFirstShake, onTrigger]);

  useEffect(() => {
    if (!enabled) return;

    if (typeof DeviceMotionEvent !== 'undefined') {
      // iOS 13+ requires permission
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('devicemotion', handleMotion);
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener('devicemotion', handleMotion);
      }
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, handleMotion]);
}