import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n.jsx';
import { Home, Navigation, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/',         icon: Home,        label: 'Home' },
  { path: '/navigate', icon: Navigation,  label: 'Navigate' },
  { path: '/report',   icon: FileText,    label: 'Reports' },
  { path: '/settings', icon: Settings,    label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto"
      style={{
        background: 'rgba(10,18,30,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <div className="flex items-center justify-around px-3 pt-2 pb-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all select-none"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-0 rounded-2xl"
                  style={{ background: 'rgba(74,158,224,0.12)', border: '1px solid rgba(74,158,224,0.2)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  className="w-5 h-5 transition-all"
                  style={{
                    color: isActive ? '#4A9EE0' : 'rgba(255,255,255,0.35)',
                    filter: isActive ? 'drop-shadow(0 0 5px rgba(74,158,224,0.5))' : 'none',
                    strokeWidth: isActive ? 2.2 : 1.6,
                  }}
                />
                <span
                  className="text-[9px] font-semibold transition-all"
                  style={{ color: isActive ? '#4A9EE0' : 'rgba(255,255,255,0.3)' }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}