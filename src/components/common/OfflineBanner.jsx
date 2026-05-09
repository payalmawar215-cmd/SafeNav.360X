import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext.jsx';

export default function OfflineBanner() {
  const { isOnline } = useAppContext();
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9990] max-w-lg mx-auto"
        >
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: 'rgba(245,158,11,0.95)', backdropFilter: 'blur(12px)' }}>
            <WifiOff className="w-3.5 h-3.5 text-white shrink-0" />
            <p className="text-xs font-semibold text-white">Offline — using cached data</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}