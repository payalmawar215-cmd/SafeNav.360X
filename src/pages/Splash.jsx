import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7c2a3f74f_LS20260509103541.png';

// Floating particles
function Particles() {
  const particles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.05,
    drift: (Math.random() - 0.5) * 30,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(74,158,224,${p.opacity})`,
          }}
          animate={{
            y: [0, -24, 0],
            x: [0, p.drift, 0],
            opacity: [p.opacity, p.opacity * 3, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Premium mesh grid
function MeshGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.035 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="52" height="52" patternUnits="userSpaceOnUse">
            <path d="M 52 0 L 0 0 0 52" fill="none" stroke="#4A9EE0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// Volumetric light rays
function LightRays() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '0',
            width: 1.5,
            height: '60%',
            background: `linear-gradient(180deg, transparent 0%, rgba(74,158,224,${0.04 + i * 0.01}) 50%, transparent 100%)`,
            transformOrigin: 'top center',
            transform: `rotate(${(i - 2) * 12}deg) translateX(-50%)`,
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function Splash() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('enter'); // enter → spin → exit
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(true);
    img.src = LOGO_URL;
  }, []);

  useEffect(() => {
    // Start spin immediately — no enter delay
    setPhase('spin');
    const t2 = setTimeout(() => setPhase('exit'), 5200);
    const t3 = setTimeout(() => {
      const seen = localStorage.getItem('safenav_onboarding_done');
      navigate(seen ? '/' : '/welcome', { replace: true });
    }, 5900);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 35%, #0F2845 0%, #0D1B2E 50%, #050D1A 100%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exit' ? 0 : 1 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          <MeshGrid />
          <Particles />
          <LightRays />

          {/* Deep center ambient glow */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74,158,224,0.1) 0%, rgba(74,158,224,0.03) 40%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Ground shadow beneath logo */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 220,
              height: 30,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(74,158,224,0.22) 0%, transparent 70%)',
              top: 'calc(50% + 105px)',
              left: '50%',
              transform: 'translateX(-50%)',
              filter: 'blur(10px)',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Logo 3D Scene */}
          <div className="relative flex flex-col items-center justify-center" style={{ perspective: '900px' }}>

            {/* Outer breathing ring */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 280,
                height: 280,
                border: '1px solid rgba(74,158,224,0.15)',
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 230,
                height: 230,
                border: '1px solid rgba(74,158,224,0.22)',
                borderRadius: '50%',
              }}
              animate={{ scale: [1, 1.07, 1], opacity: [0.4, 0.85, 0.4] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />

            {/* Rim glow that intensifies mid-rotation */}
            <motion.div
              className="absolute rounded-[28px] pointer-events-none"
              style={{
                width: 176,
                height: 176,
                borderRadius: 30,
              }}
              animate={{
                boxShadow: phase === 'spin'
                  ? [
                      '0 0 30px rgba(74,158,224,0.25), 0 0 60px rgba(74,158,224,0.1)',
                      '0 0 60px rgba(74,158,224,0.55), 0 0 100px rgba(74,158,224,0.25)',
                      '0 0 80px rgba(74,158,224,0.7), 0 0 140px rgba(74,158,224,0.3)',
                      '0 0 60px rgba(74,158,224,0.55), 0 0 100px rgba(74,158,224,0.25)',
                      '0 0 30px rgba(74,158,224,0.25), 0 0 60px rgba(74,158,224,0.1)',
                    ]
                  : '0 0 30px rgba(74,158,224,0.3), 0 0 60px rgba(74,158,224,0.1)',
              }}
              transition={phase === 'spin'
                ? { duration: 5, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }
                : { duration: 0.4 }}
            />

            {/* 3D Logo Spin Container */}
            <motion.div
              style={{
                width: 168,
                height: 168,
                transformStyle: 'preserve-3d',
                position: 'relative',
              }}
              animate={phase === 'spin' ? {
                rotateY: [0, 360],
                y: [0, -10, 0, -6, 0],
                scale: [1, 1.04, 1, 1.02, 1],
              } : {
                rotateY: 0, y: 0, scale: 1,
              }}
              transition={phase === 'spin' ? {
                rotateY: {
                  duration: 5,
                  ease: [0.25, 0.1, 0.25, 1],
                  times: [0, 1],
                },
                y: { duration: 5, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] },
                scale: { duration: 5, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] },
              } : { duration: 0.4 }}
            >
              {/* Front face */}
              {logoLoaded ? (
                <div
                  style={{
                    width: 168,
                    height: 168,
                    borderRadius: 30,
                    overflow: 'hidden',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    position: 'relative',
                    boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)',
                    border: '1.5px solid rgba(74,158,224,0.3)',
                    background: '#0B1825',
                  }}
                >
                  <img
                    src={LOGO_URL}
                    alt="SafeNav360X"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {/* Glass sheen overlay */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0) 100%)',
                      backgroundSize: '200% 200%',
                    }}
                    animate={phase === 'spin' ? { backgroundPosition: ['200% 200%', '-200% -200%'] } : {}}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                  {/* Top edge highlight */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
                    borderRadius: '30px 30px 0 0',
                  }} />
                </div>
              ) : (
                <div style={{
                  width: 168, height: 168, borderRadius: 30,
                  background: 'rgba(74,158,224,0.07)',
                  border: '1.5px solid rgba(74,158,224,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backfaceVisibility: 'hidden',
                }}>
                  <motion.div
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(74,158,224,0.35)' }}
                  />
                </div>
              )}

              {/* Back face (mirror) */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 168, height: 168,
                borderRadius: 30,
                overflow: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(74,158,224,0.25)',
                background: '#0B1825',
              }}>
                {logoLoaded && (
                  <img
                    src={LOGO_URL}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
                  />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, rgba(74,158,224,0.12) 0%, transparent 60%)',
                }} />
              </div>
            </motion.div>
          </div>

          {/* Brand text */}
          <motion.div
            className="mt-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: phase === 'spin' ? 1 : 0.6, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9 }}
          >
            {/* Shimmer text */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: '-0.03em',
                color: '#EFF1F5',
                lineHeight: 1,
              }}>
                SafeNav<span style={{ color: '#4A9EE0' }}>360X</span>
              </p>
              {/* shimmer sweep */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  width: 60,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  transform: 'skewX(-15deg)',
                }}
                animate={{ left: ['-60px', '200px'] }}
                transition={{ duration: 2.5, delay: 1, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
              />
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.3)',
              marginTop: 9,
              textTransform: 'uppercase',
            }}>
              Women Safety Intelligence
            </p>
          </motion.div>

          {/* Bottom progress bar */}
          <motion.div
            className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'spin' ? 1 : 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <p style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
              Initializing
            </p>
            <div style={{ width: 130, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg, #4A9EE0, #7EC8F8, #4A9EE0)', borderRadius: 2, backgroundSize: '200% 100%' }}
                initial={{ width: '0%' }}
                animate={phase === 'spin' ? {
                  width: '100%',
                  backgroundPosition: ['0% 0%', '200% 0%'],
                } : {}}
                transition={{ width: { duration: 5, ease: 'linear' }, backgroundPosition: { duration: 1.5, repeat: Infinity, ease: 'linear' } }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}