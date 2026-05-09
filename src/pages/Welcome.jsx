import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://media.base44.com/images/public/69e449b5017790d72143e6e1/7c2a3f74f_LS20260509103541.png';

// Floating particles
function MiniParticles() {
  const pts = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.8,
    dur: Math.random() * 6 + 5,
    delay: Math.random() * 4,
    op: Math.random() * 0.25 + 0.05,
    drift: (Math.random() - 0.5) * 24,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(74,158,224,${p.op})` }}
          animate={{ y: [0, -20, 0], x: [0, p.drift, 0], opacity: [p.op, p.op * 3, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();

  const handleLogin = () => {
    base44.auth.redirectToLogin('/');
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } } };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0F2845 0%, #0D1B2E 55%, #060E1A 100%)' }}
    >
      {/* Mesh grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }}>
        <defs>
          <pattern id="wgrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#4A9EE0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wgrid)" />
      </svg>

      <MiniParticles />

      {/* Ambient glow */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,158,224,0.08) 0%, transparent 70%)',
          top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Top section */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="relative z-10 flex flex-col items-center pt-20 px-6 w-full"
      >
        {/* Logo */}
        <motion.div variants={item} className="mb-6 relative">
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-[28px]"
            style={{ margin: -8 }}
            animate={{ boxShadow: ['0 0 20px rgba(74,158,224,0.2)', '0 0 50px rgba(74,158,224,0.45)', '0 0 20px rgba(74,158,224,0.2)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <img
            src={LOGO_URL}
            alt="SafeNav360X"
            style={{
              width: 130, height: 130,
              borderRadius: 28,
              border: '1.5px solid rgba(74,158,224,0.3)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </motion.div>

        {/* Brand name */}
        <motion.div variants={item} className="text-center mb-3">
          <p style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: '#EFF1F5', lineHeight: 1 }}>
            SafeNav<span style={{ color: '#4A9EE0' }}>360X</span>
          </p>
        </motion.div>

        {/* Tagline */}
        <motion.div variants={item} className="text-center mb-2">
          <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280, textAlign: 'center' }}>
            Your Smart Safety Navigation System
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div variants={item} className="flex items-center gap-3 my-5 w-full max-w-xs">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <Shield className="w-3.5 h-3.5" style={{ color: 'rgba(74,158,224,0.5)' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </motion.div>

        {/* Feature pills */}
        <motion.div variants={item} className="flex flex-wrap gap-2 justify-center mb-2">
          {['AI Safety', 'Live Routes', 'SOS Alert', 'Real-time'].map(f => (
            <span key={f} style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(74,158,224,0.1)',
              border: '1px solid rgba(74,158,224,0.2)',
              color: 'rgba(74,158,224,0.8)',
            }}>{f}</span>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom CTA section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full px-5 pb-12"
        style={{
          background: 'linear-gradient(to top, rgba(6,14,26,0.95) 0%, rgba(6,14,26,0.6) 60%, transparent 100%)',
          paddingTop: 40,
        }}
      >
        {/* Primary — Login / Sign Up */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2.5 mb-3"
          style={{
            height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #4A9EE0, #2F7DC8)',
            boxShadow: '0 4px 28px rgba(74,158,224,0.45)',
            fontWeight: 700, fontSize: 16, color: 'white', border: 'none', cursor: 'pointer',
          }}
        >
          <LogIn className="w-4.5 h-4.5" /> Get Started — Sign In
        </motion.button>

        {/* Secondary — Create account */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2.5 mb-5"
          style={{
            height: 52, borderRadius: 18,
            background: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(74,158,224,0.25)',
            fontWeight: 600, fontSize: 15, color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          }}
        >
          <UserPlus className="w-4 h-4" /> Create Account
        </motion.button>

        {/* Terms */}
        <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <span style={{ color: 'rgba(74,158,224,0.6)' }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: 'rgba(74,158,224,0.6)' }}>Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}