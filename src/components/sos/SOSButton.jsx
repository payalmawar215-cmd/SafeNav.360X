import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/lib/AppContext.jsx';
import { useShakeSOS } from '@/hooks/useShakeSOS';

const HOLD_DURATION = 2000;

export default function SOSButton() {
  const navigate = useNavigate();
  const { triggerSOS, shakeSOSEnabled = false } = useAppContext();
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shakeWarning, setShakeWarning] = useState(false);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const shakeWarnRef = useRef(null);

  const activate = () => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    triggerSOS();
    navigate('/sos');
  };

  useShakeSOS({
    enabled: shakeSOSEnabled,
    onFirstShake: () => {
      setShakeWarning(true);
      clearTimeout(shakeWarnRef.current);
      shakeWarnRef.current = setTimeout(() => setShakeWarning(false), 2500);
    },
    onTrigger: activate,
  });

  const startPress = () => {
    setPressing(true); setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => { p += 100 / (HOLD_DURATION / 50); setProgress(Math.min(100, p)); }, 50);
    timerRef.current = setTimeout(() => { clearInterval(intervalRef.current); activate(); }, HOLD_DURATION);
  };

  const endPress = () => { setPressing(false); setProgress(0); clearTimeout(timerRef.current); clearInterval(intervalRef.current); };
  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(intervalRef.current); clearTimeout(shakeWarnRef.current); }, []);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      <AnimatePresence>
        {shakeWarning && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute -top-9 whitespace-nowrap text-[10px] font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.95)', color: 'white' }}>
            📳 Shake again for SOS!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onMouseDown={startPress} onMouseUp={endPress} onMouseLeave={endPress}
        onTouchStart={e => { e.preventDefault(); startPress(); }} onTouchEnd={endPress}
        whileTap={{ scale: 0.87 }}
        className="relative" aria-label="SOS — Hold 2 seconds"
      >
        {/* Pulse rings */}
        <div className="absolute inset-0 -m-3 rounded-full"
          style={{ background: 'rgba(239,68,68,0.15)', animation: 'sos-pulse 1.4s ease-out infinite' }} />
        <div className="absolute inset-0 -m-1 rounded-full"
          style={{ background: 'rgba(239,68,68,0.2)', animation: 'sos-pulse 1.4s ease-out 0.4s infinite' }} />

        {/* Button */}
        <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: pressing ? '#DC2626' : '#EF4444',
            boxShadow: '0 0 0 4px rgba(239,68,68,0.2), 0 4px 24px rgba(239,68,68,0.45)',
          }}>
          {pressing && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
            </svg>
          )}
          <span className="text-white font-black text-xs tracking-widest relative z-10">SOS</span>
        </div>
      </motion.button>

      <AnimatePresence>
        {!pressing && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[9px] font-semibold mt-1.5 text-red-400/60">Hold 2s</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}