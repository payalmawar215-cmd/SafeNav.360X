import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

export default function NotificationBell({ count, hasUrgent, onClick }) {
  return (
    <button onClick={onClick} className="relative">
      <motion.div
        animate={hasUrgent ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
        transition={{ duration: 0.5, repeat: hasUrgent ? Infinity : 0, repeatDelay: 4 }}
      >
        <Bell className="w-5 h-5" style={{ color: hasUrgent ? '#EF4444' : '#9CA3AF' }} />
      </motion.div>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ background: hasUrgent ? '#EF4444' : '#4F46E5', boxShadow: hasUrgent ? '0 0 6px rgba(239,68,68,0.6)' : 'none' }}
          >
            {count > 99 ? '99+' : count}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}