import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MapPin, Shield, Users, Navigation, Bell, MessageCircle,
  ChevronRight, Clock, AlertTriangle, CheckCircle2, Mic, Camera,
  TrendingUp, Activity, Zap, UserCircle, Plus, Phone
} from 'lucide-react';
import MapView from '@/components/map/MapView';
import { calculateSafetyScore } from '@/lib/mockData';
import NotificationBell from '@/components/notifications/NotificationBell';
import { getNotificationHistory } from '@/lib/notificationEngine';

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

// ── Reusable white card ────────────────────────────────────────
function WhiteCard({ children, className = '', onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      className={`card-white p-4 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ── Icon pill ─────────────────────────────────────────────────
function IconBox({ icon, bg = '#0D1B2E', size = 40 }) {
  return (
    <div
      className="icon-container-navy flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: bg, borderRadius: 14 }}
    >
      {icon}
    </div>
  );
}

// ── Safety ring ───────────────────────────────────────────────
function SafetyRing({ score }) {
  const r = 32; const circ = 2 * Math.PI * r;
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg className="absolute inset-0 -rotate-90" width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(74,158,224,0.1)" strokeWidth="7" />
        <circle cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-black text-xl" style={{ color, lineHeight: 1 }}>{score}</span>
        <span className="text-[8px] font-semibold" style={{ color: 'rgba(13,27,46,0.45)' }}>SCORE</span>
      </div>
    </div>
  );
}

const ACTIVITY_ICONS = {
  harassment: '🚫', unsafe_street: '🛣️', suspicious: '👁️', poor_lighting: '💡', other: '📋',
};

export default function Home() {
  const navigate = useNavigate();
  const { userLocation, contacts, isOnline } = useAppContext();
  const isNight = new Date().getHours() >= 19 || new Date().getHours() < 6;
  const safetyScore = calculateSafetyScore(isNight ? 'night' : 'day', 72, 65, 58);
  const unread = getNotificationHistory().filter(n => !n.read).length;

  const { data: reports = [] } = useQuery({
    queryKey: ['home-reports'],
    queryFn: () => base44.entities.IncidentReport.list('-created_date', 4),
    refetchInterval: 30000,
  });

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="flex flex-col min-h-full" style={{ background: '#0D1B2E' }}>

      {/* ── Top Bar ── */}
      <motion.div variants={item} className="px-4 pt-12 pb-4 flex items-center justify-between">
        {/* Profile */}
        <button className="flex items-center gap-2.5" onClick={() => navigate('/settings')}>
          <div className="icon-container" style={{ width: 40, height: 40 }}>
            <UserCircle className="w-5 h-5" style={{ color: '#0D1B2E' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">SafeNav360X</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isOnline ? '● Online' : '○ Offline'}
            </p>
          </div>
        </button>
        {/* Right icons */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chat')}
            className="icon-container" style={{ width: 38, height: 38 }}>
            <MessageCircle className="w-4 h-4" style={{ color: '#0D1B2E' }} />
          </button>
          <button onClick={() => navigate('/notifications')} className="relative icon-container" style={{ width: 38, height: 38 }}>
            <Bell className="w-4 h-4" style={{ color: '#0D1B2E' }} />
            {unread > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: '#EF4444' }}>{unread > 9 ? '9+' : unread}</div>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── Hero Safety Card ── */}
      <motion.div variants={item} className="px-4 mb-4">
        <WhiteCard>
          <div className="flex items-center gap-4">
            <SafetyRing score={safetyScore} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(13,27,46,0.5)' }}>AREA SAFETY</p>
              <p className="font-black text-xl leading-tight" style={{ color: '#0D1B2E' }}>
                {safetyScore >= 75 ? 'Looks Safe' : safetyScore >= 50 ? 'Stay Alert' : 'High Risk'}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: '#4A9EE0' }} />
                <span className="text-xs" style={{ color: 'rgba(13,27,46,0.5)' }}>
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4A9EE0' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#4A9EE0' }}>AI-powered · Real-time</span>
              </div>
            </div>
          </div>

          {/* Safety bar */}
          <div className="mt-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(13,27,46,0.45)' }}>SAFETY INDEX</span>
              <span className="text-[10px] font-bold" style={{ color: '#4A9EE0' }}>{safetyScore}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(13,27,46,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${safetyScore}%`,
                  background: safetyScore >= 75 ? '#22C55E' : safetyScore >= 50 ? '#F59E0B' : '#EF4444',
                }} />
            </div>
          </div>
        </WhiteCard>
      </motion.div>

      {/* ── Map ── */}
      <motion.div variants={item} className="px-4 mb-4">
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', height: 160 }}>
          <MapView height="160px" />
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div variants={item} className="px-4 mb-4">
        <p className="label-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>QUICK ACTIONS</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Navigation className="w-5 h-5 text-white" />, label: 'Navigate', bg: '#4A9EE0', path: '/navigate' },
            { icon: <AlertTriangle className="w-5 h-5 text-white" />, label: 'Report', bg: '#E07A4A', path: '/report' },
            { icon: <Users className="w-5 h-5 text-white" />, label: 'Contacts', bg: '#4ACE9E', path: '/settings' },
          ].map((a, i) => (
            <motion.button key={i} whileTap={{ scale: 0.94 }} onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2.5 py-4 rounded-[18px]"
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-11 h-11 rounded-[14px] flex items-center justify-center"
                style={{ background: a.bg }}>
                {a.icon}
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Status Cards ── */}
      <motion.div variants={item} className="px-4 mb-4">
        <p className="label-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>STATUS</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Trusted Contacts */}
          <WhiteCard onClick={() => navigate('/settings')} className="!p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <IconBox icon={<Users className="w-4 h-4 text-white" />} size={34} />
              <span className="text-xs font-bold" style={{ color: '#0D1B2E' }}>Contacts</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#0D1B2E' }}>{contacts.length}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(13,27,46,0.45)' }}>Trusted people</p>
          </WhiteCard>

          {/* Location */}
          <WhiteCard className="!p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <IconBox icon={<MapPin className="w-4 h-4 text-white" />} size={34} bg="#4A9EE0" />
              <span className="text-xs font-bold" style={{ color: '#0D1B2E' }}>Location</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs font-semibold" style={{ color: '#0D1B2E' }}>GPS Active</p>
            </div>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(13,27,46,0.45)' }}>High accuracy</p>
          </WhiteCard>

          {/* Nearby Reports */}
          <WhiteCard className="!p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <IconBox icon={<AlertTriangle className="w-4 h-4 text-white" />} size={34} bg="#E07A4A" />
              <span className="text-xs font-bold" style={{ color: '#0D1B2E' }}>Reports</span>
            </div>
            <p className="text-2xl font-black" style={{ color: '#0D1B2E' }}>{reports.length}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(13,27,46,0.45)' }}>Near you</p>
          </WhiteCard>

          {/* Night mode */}
          <WhiteCard className="!p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <IconBox icon={<Shield className="w-4 h-4 text-white" />} size={34} bg="#7C4AE0" />
              <span className="text-xs font-bold" style={{ color: '#0D1B2E' }}>Mode</span>
            </div>
            <p className="text-xs font-bold" style={{ color: '#0D1B2E' }}>{isNight ? '🌙 Night' : '☀️ Day'}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(13,27,46,0.45)' }}>Auto-detected</p>
          </WhiteCard>
        </div>
      </motion.div>

      {/* ── Night alert ── */}
      {isNight && (
        <motion.div variants={item} className="px-4 mb-4">
          <div className="rounded-[18px] p-4 flex items-start gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Night Mode Active</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Stay on well-lit routes. Share location with contacts.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Recent Activity ── */}
      <motion.div variants={item} className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>RECENT ACTIVITY</p>
          <button onClick={() => navigate('/report')}
            className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: '#4A9EE0' }}>
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-[18px] p-6 text-center"
            style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No nearby activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r, i) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-[16px] px-3.5 py-3 flex items-center gap-3"
                style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center text-base shrink-0"
                  style={{ background: 'rgba(74,158,224,0.1)', border: '1px solid rgba(74,158,224,0.15)' }}>
                  {ACTIVITY_ICONS[r.type] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.description || r.type?.replace('_', ' ')}</p>
                  <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Clock className="w-3 h-3" /> {timeAgo(r.created_date)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Emergency Numbers ── */}
      <motion.div variants={item} className="px-4 mb-6">
        <p className="label-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>EMERGENCY</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: '112', label: 'Emergency' },
            { num: '181', label: 'Women Help' },
            { num: '100', label: 'Police' },
          ].map(e => (
            <a key={e.num} href={`tel:${e.num}`}
              className="flex flex-col items-center py-3.5 rounded-[16px] transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <span className="text-base font-black" style={{ color: '#EF6461' }}>{e.num}</span>
              <span className="text-[9px] font-medium mt-0.5 text-center leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{e.label}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}