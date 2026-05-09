import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

// ── Screen visuals ──────────────────────────────────────────────

function NavVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ongrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#4A9EE0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ongrid)" />
      </svg>

      {/* Route SVG */}
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'relative', zIndex: 1 }}>
        {/* Glowing path */}
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5A0" />
            <stop offset="100%" stopColor="#4A9EE0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Path glow */}
        <motion.path
          d="M 50 160 Q 60 100 100 80 Q 140 60 150 40"
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeOut' }}
        />

        {/* Start dot */}
        <motion.circle cx="50" cy="160" r="10" fill="#00E5A0"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} />
        <circle cx="50" cy="160" r="4" fill="white" />

        {/* End — shield pin */}
        <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.8, type: 'spring', bounce: 0.4 }}>
          <circle cx="150" cy="40" r="22" fill="rgba(74,158,224,0.15)" stroke="rgba(74,158,224,0.4)" strokeWidth="1" />
          <circle cx="150" cy="40" r="14" fill="rgba(74,158,224,0.25)" stroke="#4A9EE0" strokeWidth="1.5" />
          {/* Shield */}
          <path d="M 150 32 C 150 32 143 35 143 41 C 143 45 146 48 150 49 C 154 48 157 45 157 41 C 157 35 150 32 150 32 Z"
            fill="#4A9EE0" />
          <line x1="150" y1="36" x2="150" y2="46" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="146" y1="41" x2="154" y2="41" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  );
}

function SOSVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Orbit rings */}
      {[80, 110, 140].map((r, i) => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: r * 2, height: r * 2,
            border: `1px solid rgba(239,68,68,${0.25 - i * 0.07})`,
            borderRadius: '50%',
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        />
      ))}

      {/* Orbit dots */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div key={i}
            className="absolute rounded-full"
            style={{
              width: 7, height: 7,
              background: '#EF4444',
              borderRadius: '50%',
              left: `calc(50% + ${Math.cos(rad) * 110}px - 3.5px)`,
              top: `calc(50% + ${Math.sin(rad) * 110}px - 3.5px)`,
              boxShadow: '0 0 8px #EF4444',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }}
          />
        );
      })}

      {/* SOS button */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{
          width: 120, height: 120,
          background: 'radial-gradient(circle, #EF4444 0%, #C41C1C 100%)',
          boxShadow: '0 0 50px rgba(239,68,68,0.5), 0 8px 32px rgba(239,68,68,0.4)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 28, color: 'white', letterSpacing: '0.05em' }}>SOS</span>
      </motion.div>
    </div>
  );
}

function AIVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer hexagon rings */}
      {[1, 2].map((i) => (
        <motion.div key={i}
          className="absolute"
          style={{
            width: 160 + i * 44,
            height: 160 + i * 44,
            border: `1px solid rgba(124,78,224,${0.3 - i * 0.1})`,
            transform: `rotate(${i * 30}deg)`,
            borderRadius: '22%',
          }}
          animate={{ rotate: [i * 30, i * 30 + 360] }}
          transition={{ duration: 18 + i * 4, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 170, height: 170,
          background: 'radial-gradient(circle, rgba(124,78,224,0.3) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Shield core */}
      <motion.div
        className="relative z-10 flex items-center justify-center rounded-[20px]"
        style={{
          width: 110, height: 110,
          background: 'linear-gradient(135deg, #7C4AE0 0%, #5B2FBF 100%)',
          boxShadow: '0 0 40px rgba(124,78,224,0.6), 0 8px 32px rgba(0,0,0,0.4)',
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Crosshair icon */}
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <line x1="25" y1="7" x2="25" y2="43" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="25" x2="43" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="25" r="4" fill="white" />
        </svg>
      </motion.div>

      {/* Orbit dot */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 8, height: 8, background: '#4A9EE0', borderRadius: '50%', boxShadow: '0 0 10px #4A9EE0' }}
        animate={{
          x: [70, 0, -70, 0, 70],
          y: [0, 35, 0, -35, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ── Screens data ────────────────────────────────────────────────
const SCREENS = [
  {
    id: 1,
    Visual: NavVisual,
    accentColor: '#4A9EE0',
    gradientFrom: 'rgba(74,158,224,0.12)',
    title: 'Safe Navigation',
    description: 'Find the safest routes powered by AI risk detection, live community updates, and real-time smart safety analysis.',
    btnGradient: 'linear-gradient(135deg, #4A9EE0, #2F7DC8)',
    btnGlow: 'rgba(74,158,224,0.45)',
  },
  {
    id: 2,
    Visual: SOSVisual,
    accentColor: '#EF4444',
    gradientFrom: 'rgba(239,68,68,0.1)',
    title: 'Emergency SOS',
    description: 'Instantly alert trusted contacts with live location sharing, emergency audio/video capture, and rapid SOS response tools.',
    btnGradient: 'linear-gradient(135deg, #4A9EE0, #EF4444)',
    btnGlow: 'rgba(200,80,80,0.4)',
  },
  {
    id: 3,
    Visual: AIVisual,
    accentColor: '#7C4AE0',
    gradientFrom: 'rgba(124,78,224,0.12)',
    title: 'AI Safety Assistant',
    description: 'Get smart safety recommendations, voice-triggered emergency support, and intelligent risk awareness wherever you go.',
    btnGradient: 'linear-gradient(135deg, #7C4AE0, #4A9EE0)',
    btnGlow: 'rgba(124,78,224,0.45)',
    isLast: true,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  // drag handled via onDragEnd only

  const skip = () => {
    localStorage.setItem('safenav_onboarding_done', '1');
    navigate('/welcome', { replace: true });
  };

  const next = () => {
    const screen = SCREENS[current];
    if (screen.isLast) { skip(); return; }
    setDir(1);
    setCurrent(c => Math.min(c + 1, SCREENS.length - 1));
  };

  const goTo = (i) => {
    setDir(i > current ? 1 : -1);
    setCurrent(i);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60 && current < SCREENS.length - 1) { setDir(1); setCurrent(c => c + 1); }
    else if (info.offset.x > 60 && current > 0) { setDir(-1); setCurrent(c => c - 1); }
  };

  const screen = SCREENS[current];
  const { Visual } = screen;

  return (
    <div className="fixed inset-0 z-[9000] flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0F2540 0%, #0D1B2E 60%, #060E1A 100%)' }}>

      {/* Subtle mesh */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}>
        <defs>
          <pattern id="ob-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#4A9EE0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ob-grid)" />
      </svg>

      {/* Ambient glow that changes per screen */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{ background: `radial-gradient(circle at 50% 35%, ${screen.gradientFrom} 0%, transparent 65%)` }}
        transition={{ duration: 0.6 }}
        style={{ inset: 0 }}
      />

      {/* Skip */}
      <div className="relative z-10 flex justify-end px-5 pt-12">
        <button onClick={skip}
          className="px-4 py-1.5 rounded-full text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
          Skip
        </button>
      </div>

      {/* Visual area */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden" style={{ maxHeight: '52%' }}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={current}
            custom={dir}
            variants={{
              enter: (d) => ({ x: d * 60, opacity: 0, scale: 0.94 }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (d) => ({ x: d * -60, opacity: 0, scale: 0.94 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            className="w-full"
            style={{ height: 260, cursor: 'grab' }}
          >
            <Visual />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-3">
        {SCREENS.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => goTo(i)}
            animate={{
              width: i === current ? 24 : 7,
              background: i === current ? screen.accentColor : 'rgba(255,255,255,0.2)',
            }}
            transition={{ duration: 0.3 }}
            style={{ height: 7, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0 }}
          />
        ))}
      </div>

      {/* Bottom card */}
      <div className="relative z-10 mx-3 mb-8 rounded-[26px] px-6 pt-6 pb-6"
        style={{
          background: 'rgba(15, 28, 50, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.3)',
        }}>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.36 }}
          >
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: '-0.03em',
              color: '#EFF1F5',
              marginBottom: 10,
            }}>
              {screen.title}
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 14.5,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 22,
            }}>
              {screen.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Next / Get Started button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={next}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: 54,
            borderRadius: 16,
            background: screen.btnGradient,
            boxShadow: `0 4px 24px ${screen.btnGlow}`,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {screen.isLast ? 'Get Started' : 'Next'}
          {!screen.isLast && <ChevronRight className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
}