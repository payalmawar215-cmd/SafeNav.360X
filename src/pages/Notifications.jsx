import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppContext } from '@/lib/AppContext.jsx';
import { PRIORITY } from '@/lib/notificationEngine';
import { calculateSafetyScore } from '@/lib/mockData';

const FILTER_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high',     label: 'High' },
  { id: 'nearby',   label: 'Nearby' },
];

const PRIORITY_STYLES = {
  [PRIORITY.CRITICAL]: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', dot: '#EF4444', label: 'Critical' },
  [PRIORITY.HIGH]:     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: '#F59E0B', label: 'High' },
  [PRIORITY.MEDIUM]:   { bg: '#111E30', border: 'rgba(255,255,255,0.07)', dot: '#4A9EE0', label: 'Medium' },
  [PRIORITY.LOW]:      { bg: '#111E30', border: 'rgba(255,255,255,0.05)', dot: 'rgba(255,255,255,0.25)', label: 'Low' },
};

function timeAgo(ms) {
  const d = (Date.now() - ms) / 1000;
  if (d < 60) return 'Just now';
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  return `${Math.floor(d/3600)}h ago`;
}

function NotifCard({ notif, onDismiss, onRead }) {
  const s = PRIORITY_STYLES[notif.priority] || PRIORITY_STYLES[PRIORITY.LOW];
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: notif.read ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }} onClick={() => onRead(notif.id)}
      className="rounded-[18px] p-4 cursor-pointer"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {notif.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-white truncate">{notif.title}</p>
            {!notif.read && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />}
          </div>
          <p className="text-xs leading-snug mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{notif.message}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${s.dot}18`, color: s.dot }}>{s.label}</span>
            {notif.distance && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>📍 {notif.distance}</span>}
            <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>{timeAgo(notif.timestamp)}</span>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
          className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Trash2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </button>
      </div>
      {notif.actions?.length > 0 && (
        <div className="flex gap-2 mt-3 ml-13">
          {notif.actions.map((a, i) => (
            <button key={i}
              className="px-3 py-1.5 rounded-[10px] text-[11px] font-semibold"
              style={i === 0 ? { background: s.dot, color: 'white' } : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Notifications() {
  const { userLocation } = useAppContext();
  const isNight = new Date().getHours() >= 19 || new Date().getHours() < 6;
  const areaScore = calculateSafetyScore(isNight ? 'night' : 'day', 72, 65, 58);
  const { notifications, unreadCount, markAllRead, markRead, dismiss, clearAll, send } = useNotifications({ userLocation, areaScore, isNight });
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return n.priority === PRIORITY.CRITICAL;
    if (activeFilter === 'high') return n.priority === PRIORITY.HIGH;
    if (activeFilter === 'nearby') return !!n.distance;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#0D1B2E' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center" style={{ background: '#EFF1F5' }}>
              <Bell className="w-5 h-5" style={{ color: '#0D1B2E' }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Alerts</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All clear'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-semibold"
                style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.08)', color: '#4A9EE0' }}>
                <CheckCheck className="w-3.5 h-3.5" /> Read all
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={clearAll}
                className="w-9 h-9 rounded-[12px] flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className="px-3.5 py-2 rounded-[12px] text-xs font-semibold transition-all"
              style={activeFilter === tab.id
                ? { background: '#EFF1F5', color: '#0D1B2E' }
                : { background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mb-4"
              style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Bell className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-sm font-bold text-white mb-1">No notifications</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map(n => <NotifCard key={n.id} notif={n} onDismiss={dismiss} onRead={markRead} />)}
          </AnimatePresence>
        )}

        {/* Test triggers */}
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>TEST ALERTS</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: '🚨 Critical', t: 'ACCIDENT_NEARBY', ti: 'Accident Nearby', m: 'Vehicle collision 0.5km ahead.' },
              { l: '⚠️ High', t: 'CRIME_NEARBY', ti: 'Crime Reported', m: 'Suspicious activity 800m away.' },
            ].map((t, i) => (
              <button key={i}
                onClick={() => send({ type: t.t, title: t.ti, message: t.m, force: true })}
                className="py-2.5 px-3 rounded-[14px] text-[11px] font-semibold text-left"
                style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}