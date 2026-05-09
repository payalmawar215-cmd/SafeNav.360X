import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, X, PhoneOff } from 'lucide-react';

export default function FakeCallModal({ onClose }) {
  const [phase, setPhase] = useState('ringing'); // ringing | connected | ended
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (phase === 'ringing') {
      // Auto-answer after 5 seconds
      const t = setTimeout(() => setPhase('connected'), 5000);
      return () => clearTimeout(t);
    }
    if (phase === 'connected') {
      const interval = setInterval(() => setSeconds(s => s + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16 px-6"
    >
      {/* Caller info */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <span className="text-3xl">👤</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Mom</h2>
        <p className="text-sm text-white/60 mt-1">
          {phase === 'ringing' ? 'Incoming call...' :
           phase === 'connected' ? formatTime(seconds) : 'Call ended'}
        </p>
      </div>

      {/* Call animation */}
      {phase === 'ringing' && (
        <div className="flex-1 flex items-center">
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
          >
            <Phone className="w-8 h-8 text-green-400" />
          </motion.div>
        </div>
      )}

      {phase === 'connected' && (
        <div className="flex-1 flex items-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-1 bg-green-400 rounded-full"
                  animate={{ height: [8, 24, 8] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-3">Connected</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-8">
        {phase === 'ringing' && (
          <>
            <button
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={() => setPhase('connected')}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </>
        )}
        {phase === 'connected' && (
          <button
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        )}
      </div>

      {/* Dismiss hint */}
      <button onClick={onClose} className="absolute top-4 right-4">
        <X className="w-5 h-5 text-white/30" />
      </button>
    </motion.div>
  );
}