import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, MapPin, Phone, Share2, Navigation } from 'lucide-react';

const ACTION_ICONS = {
  view_map: <MapPin className="w-3.5 h-3.5" />,
  call_emergency: <Phone className="w-3.5 h-3.5" />,
  share_location: <Share2 className="w-3.5 h-3.5" />,
  reroute: <Navigation className="w-3.5 h-3.5" />,
};

export default function CriticalAlertOverlay({ alert, onDismiss, onAction }) {
  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: -80, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed top-3 left-3 right-3 z-[9999]"
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.97), rgba(185,28,28,0.97))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(239,68,68,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Pulsing top bar */}
          <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.3)', animation: 'shimmer 1.5s infinite' }} />

          <div className="px-4 pt-4 pb-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white leading-tight">{alert.title}</p>
                <p className="text-xs mt-0.5 text-white/80 leading-snug">{alert.message}</p>
                {alert.distance && (
                  <p className="text-[10px] mt-1 font-semibold text-white/60">📍 {alert.distance} away</p>
                )}
              </div>
              <button onClick={onDismiss}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Actions */}
            {alert.actions?.length > 0 && (
              <div className="flex gap-2 mt-2">
                {alert.actions.map((action, i) => (
                  <button key={i}
                    onClick={() => onAction?.(action)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold"
                    style={i === 0
                      ? { background: 'white', color: '#EF4444' }
                      : { background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    {ACTION_ICONS[action.action] || null}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}