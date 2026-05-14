import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Edit3, Save, X, Shield, Zap, Star,
  Award, TrendingUp, CheckCircle2, Lock, Crown
} from 'lucide-react';

const RANKS = [
  { id: 'beginner',        label: 'Beginner',        minXP: 0,    color: '#9CA3AF', glow: 'rgba(156,163,175,0.4)',  icon: '🌱' },
  { id: 'explorer',        label: 'Explorer',        minXP: 200,  color: '#60A5FA', glow: 'rgba(96,165,250,0.4)',   icon: '🔭' },
  { id: 'guardian',        label: 'Guardian',        minXP: 600,  color: '#34D399', glow: 'rgba(52,211,153,0.4)',   icon: '🛡️' },
  { id: 'elite_guardian',  label: 'Elite Guardian',  minXP: 1200, color: '#F59E0B', glow: 'rgba(245,158,11,0.4)',   icon: '⚔️' },
  { id: 'master_nav',      label: 'Master Navigator',minXP: 2500, color: '#A78BFA', glow: 'rgba(167,139,250,0.4)',  icon: '🧭' },
  { id: 'grandmaster',     label: 'Grandmaster',     minXP: 5000, color: '#F87171', glow: 'rgba(248,113,113,0.4)',  icon: '💎' },
  { id: 'celestial_apex',  label: 'Celestial Apex',  minXP: 10000,color: '#FCD34D', glow: 'rgba(252,211,77,0.6)',   icon: '👑' },
];

const BADGES = [
  { id: 'first_report',  label: 'First Report',       desc: 'Submitted first incident',   rarity: 'common',    icon: '📋', xp: 50,  color: '#9CA3AF' },
  { id: 'safe_traveler', label: 'Safe Traveler',       desc: 'Completed 5 safe trips',     rarity: 'rare',      icon: '🛤️', xp: 100, color: '#22D3EE' },
  { id: 'guardian',      label: 'Guardian',            desc: '10 approved reports',        rarity: 'rare',      icon: '🛡️', xp: 200, color: '#22D3EE' },
  { id: 'sos_hero',      label: 'SOS Hero',            desc: 'Used & resolved SOS safely', rarity: 'elite',     icon: '🚨', xp: 150, color: '#F87171' },
  { id: 'community',     label: 'Community Pillar',   desc: '25 upvotes on reports',      rarity: 'legendary', icon: '🏆', xp: 300, color: '#FCD34D' },
  { id: 'streak_7',      label: '7-Day Streak',        desc: 'Active 7 days in a row',     rarity: 'rare',      icon: '🔥', xp: 175, color: '#22D3EE' },
  { id: 'night_owl',     label: 'Night Owl',           desc: 'Reported at night safely',   rarity: 'common',    icon: '🦉', xp: 75,  color: '#9CA3AF' },
  { id: 'apex_defender', label: 'Apex Defender',       desc: 'Reached Celestial Apex',     rarity: 'legendary', icon: '👑', xp: 500, color: '#FCD34D' },
];

const RARITY_STYLES = {
  common:    { border: 'rgba(156,163,175,0.4)',  bg: 'rgba(156,163,175,0.08)', label: 'Common',    labelColor: '#9CA3AF' },
  rare:      { border: 'rgba(34,211,238,0.45)',  bg: 'rgba(34,211,238,0.08)',  label: 'Rare',      labelColor: '#22D3EE' },
  elite:     { border: 'rgba(248,113,113,0.45)', bg: 'rgba(248,113,113,0.08)', label: 'Elite',     labelColor: '#F87171' },
  legendary: { border: 'rgba(252,211,77,0.5)',   bg: 'rgba(252,211,77,0.08)',  label: 'Legendary', labelColor: '#FCD34D' },
};

function getRankForXP(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return { rank: RANKS[i], index: i };
  }
  return { rank: RANKS[0], index: 0 };
}

function getNextRank(index) {
  return index < RANKS.length - 1 ? RANKS[index + 1] : null;
}

// ── Floating particles ────────────────────────────────────────
function Particles() {
  const pts = Array.from({ length: 16 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 0.5, dur: Math.random() * 7 + 5,
    delay: Math.random() * 4, op: Math.random() * 0.2 + 0.04,
    drift: (Math.random() - 0.5) * 20,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pts.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(74,158,224,${p.op})` }}
          animate={{ y: [0, -18, 0], x: [0, p.drift, 0], opacity: [p.op, p.op * 3.5, p.op] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

// ── Badge card ────────────────────────────────────────────────
function BadgeCard({ badge, earned, onTap }) {
  const rs = RARITY_STYLES[badge.rarity];
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onTap(badge)}
      className="flex-shrink-0 flex flex-col items-center p-3 rounded-[18px] relative overflow-hidden"
      style={{
        width: 90,
        background: earned ? rs.bg : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${earned ? rs.border : 'rgba(255,255,255,0.07)'}`,
        filter: earned ? 'none' : 'grayscale(1)',
        opacity: earned ? 1 : 0.4,
      }}
    >
      {earned && (
        <motion.div className="absolute inset-0 rounded-[18px] pointer-events-none"
          animate={{ boxShadow: [`0 0 0px ${badge.color}00`, `0 0 18px ${badge.color}40`, `0 0 0px ${badge.color}00`] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
      )}
      <div className="text-3xl mb-1.5">{badge.icon}</div>
      <p className="text-[10px] font-bold text-white text-center leading-tight">{badge.label}</p>
      {earned
        ? <span className="text-[9px] font-semibold mt-1" style={{ color: rs.labelColor }}>{rs.label}</span>
        : <Lock className="w-3 h-3 mt-1" style={{ color: 'rgba(255,255,255,0.25)' }} />
      }
    </motion.button>
  );
}

// ── Badge popup ───────────────────────────────────────────────
function BadgePopup({ badge, earned, onClose }) {
  const rs = RARITY_STYLES[badge.rarity];
  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }} transition={{ type: 'spring', bounce: 0.35 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xs rounded-[28px] p-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #111E30, #0D1B2E)', border: `1.5px solid ${earned ? rs.border : 'rgba(255,255,255,0.08)'}` }}
      >
        {earned && (
          <motion.div className="absolute inset-0 pointer-events-none"
            animate={{ background: [`radial-gradient(circle at 50% 30%, ${badge.color}12 0%, transparent 60%)`, `radial-gradient(circle at 50% 30%, ${badge.color}22 0%, transparent 60%)`] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        )}
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        <div className="text-6xl mb-4 mt-2">{badge.icon}</div>
        <p className="text-xl font-black text-white mb-1">{badge.label}</p>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: rs.bg, color: rs.labelColor }}>{rs.label}</span>
        <p className="text-sm mt-3 mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{badge.desc}</p>
        <div className="flex items-center justify-center gap-2 rounded-[14px] py-2.5" style={{ background: 'rgba(74,158,224,0.08)', border: '1px solid rgba(74,158,224,0.2)' }}>
          <Zap className="w-4 h-4" style={{ color: '#4A9EE0' }} />
          <span className="text-sm font-bold" style={{ color: '#4A9EE0' }}>+{badge.xp} XP</span>
        </div>
        {!earned && <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>🔒 Not yet unlocked</p>}
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function UserProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.full_name || 'SafeNav User');
  const [bio, setBio] = useState('Keeping communities safer every day 🛡️');
  const [safenav_id, setSafenavId] = useState(`SN-${(user?.id || '0000').slice(-6).toUpperCase()}`);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const fileRef = useRef();

  const { data: scores = [] } = useQuery({
    queryKey: ['safety-score', user?.id],
    queryFn: () => base44.entities.SafetyScore.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const score = scores[0];
  const totalXP = (score?.total_points || 0);
  const { rank, index: rankIndex } = getRankForXP(totalXP);
  const nextRank = getNextRank(rankIndex);
  const xpToNext = nextRank ? nextRank.minXP - totalXP : 0;
  const xpProgress = nextRank ? ((totalXP - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100 : 100;
  const earnedBadges = score?.badges || [];

  const stats = [
    { label: 'Safety Score', value: score?.total_points ? Math.min(99, 60 + Math.floor(score.total_points / 30)) : '—', icon: <Shield className="w-4 h-4" />, color: '#22C55E' },
    { label: 'Safe Trips',   value: score?.safe_trips || 0,         icon: <TrendingUp className="w-4 h-4" />, color: '#4A9EE0' },
    { label: 'SOS Saves',    value: score?.check_ins || 0,           icon: <Zap className="w-4 h-4" />,       color: '#F59E0B' },
    { label: 'XP Points',    value: totalXP,                         icon: <Star className="w-4 h-4" />,      color: '#A78BFA' },
    { label: 'Reports',      value: score?.reports_submitted || 0,   icon: <Award className="w-4 h-4" />,     color: '#F87171' },
    { label: 'Streak',       value: `${score?.streak_days || 0}d`,   icon: <CheckCircle2 className="w-4 h-4" />, color: '#34D399' },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F2845 0%, #0D1B2E 50%, #060E1A 100%)' }}>
      <Particles />

      {/* Mesh grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.025 }}>
        <defs><pattern id="pg" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#4A9EE0" strokeWidth="0.5" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#pg)" />
      </svg>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[13px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white">My Profile</h1>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>SafeNav360X Identity</p>
        </div>
        <button onClick={() => setEditing(e => !e)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[13px] text-xs font-semibold"
          style={editing
            ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#22C55E' }
            : { background: 'rgba(74,158,224,0.12)', border: '1px solid rgba(74,158,224,0.3)', color: '#4A9EE0' }}>
          {editing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
        </button>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 px-4 pb-16 space-y-5">

        {/* ── Avatar + Identity Card ── */}
        <motion.div variants={item} className="rounded-[24px] p-5 relative overflow-hidden"
          style={{ background: 'rgba(15,28,50,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none" style={{
            background: `radial-gradient(circle at 100% 0%, ${rank.color}18 0%, transparent 70%)`,
          }} />

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <motion.div className="absolute inset-0 rounded-full" style={{ margin: -3 }}
                animate={{ boxShadow: [`0 0 16px ${rank.color}50`, `0 0 36px ${rank.color}80`, `0 0 16px ${rank.color}50`] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${rank.color}30, rgba(13,27,46,0.9))`, border: `2.5px solid ${rank.color}60` }}>
                {username[0]?.toUpperCase() || '?'}
              </div>
              {editing && (
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: '#4A9EE0', border: '2px solid #0D1B2E' }}>
                  <Camera className="w-3 h-3 text-white" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full text-lg font-black text-white bg-transparent border-b mb-1 outline-none"
                  style={{ borderColor: 'rgba(74,158,224,0.4)' }} />
              ) : (
                <p className="text-lg font-black text-white truncate">{username}</p>
              )}
              {editing ? (
                <input value={safenav_id} onChange={e => setSafenavId(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border-b mb-2 outline-none"
                  style={{ borderColor: 'rgba(74,158,224,0.3)', color: 'rgba(74,158,224,0.8)' }} />
              ) : (
                <p className="text-xs font-mono mb-2" style={{ color: '#4A9EE0' }}>{safenav_id}</p>
              )}
              {editing ? (
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                  className="w-full text-xs bg-transparent outline-none resize-none"
                  style={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{bio}</p>
              )}
            </div>
          </div>

          {/* Rank banner */}
          <div className="mt-4 flex items-center gap-3 rounded-[14px] px-3 py-2.5"
            style={{ background: `${rank.color}12`, border: `1px solid ${rank.color}30` }}>
            <span className="text-xl">{rank.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-black" style={{ color: rank.color }}>{rank.label.toUpperCase()}</p>
              {nextRank && (
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {xpToNext} XP to {nextRank.label}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" style={{ color: rank.color }} />
              <span className="text-sm font-black" style={{ color: rank.color }}>{totalXP}</span>
            </div>
          </div>

          {/* XP progress */}
          {nextRank && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${Math.max(2, xpProgress)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})` }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div variants={item}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>STATISTICS</p>
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map((s, i) => (
              <motion.div key={i} whileTap={{ scale: 0.96 }}
                className="rounded-[18px] p-3 text-center relative overflow-hidden"
                style={{ background: 'rgba(15,28,50,0.8)', border: `1px solid ${s.color}20`, backdropFilter: 'blur(12px)' }}>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}10 0%, transparent 65%)` }} />
                <div className="flex justify-center mb-1.5" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Rank Ladder ── */}
        <motion.div variants={item}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>RANK PROGRESSION</p>
          <div className="rounded-[20px] p-4 relative overflow-hidden"
            style={{ background: 'rgba(15,28,50,0.85)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
            <div className="space-y-3">
              {RANKS.map((r, i) => {
                const isCurrentRank = r.id === rank.id;
                const isUnlocked = totalXP >= r.minXP;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{
                        background: isUnlocked ? `${r.color}20` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${isUnlocked ? r.color : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: isCurrentRank ? `0 0 12px ${r.glow}` : 'none',
                      }}>
                      {isUnlocked ? r.icon : <Lock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: isUnlocked ? r.color : 'rgba(255,255,255,0.25)' }}>
                          {r.label}
                        </p>
                        {isCurrentRank && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: `${r.color}20`, color: r.color }}>CURRENT</span>
                        )}
                      </div>
                      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{r.minXP.toLocaleString()} XP</p>
                    </div>
                    {isCurrentRank && (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Crown className="w-4 h-4" style={{ color: r.color }} />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Badge Showcase ── */}
        <motion.div variants={item}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>BADGES & ACHIEVEMENTS</p>
          <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
            {BADGES.map(b => (
              <BadgeCard key={b.id} badge={b} earned={earnedBadges.includes(b.id)} onTap={setSelectedBadge} />
            ))}
          </div>
        </motion.div>

        {/* ── Achievement Timeline ── */}
        <motion.div variants={item}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>RECENT ACTIVITY</p>
          <div className="space-y-2">
            {earnedBadges.length === 0 ? (
              <div className="rounded-[18px] p-5 text-center"
                style={{ background: 'rgba(15,28,50,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No achievements yet. Start earning!</p>
              </div>
            ) : earnedBadges.map((bid, i) => {
              const b = BADGES.find(x => x.id === bid);
              if (!b) return null;
              const rs = RARITY_STYLES[b.rarity];
              return (
                <div key={i} className="flex items-center gap-3 rounded-[16px] px-3.5 py-3"
                  style={{ background: 'rgba(15,28,50,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="text-xl">{b.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{b.label}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{b.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rs.bg, color: rs.labelColor }}>
                    +{b.xp} XP
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      {/* Badge popup */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgePopup
            badge={selectedBadge}
            earned={earnedBadges.includes(selectedBadge.id)}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}