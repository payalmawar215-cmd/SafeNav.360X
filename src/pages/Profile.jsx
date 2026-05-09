import { useNavigate } from 'react-router-dom';
import { UserCircle, Shield, Star, Activity, ChevronRight, MapPin } from 'lucide-react';
import { useAppContext } from '@/lib/AppContext.jsx';
import { motion } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const { contacts, userLocation } = useAppContext();

  return (
    <div className="flex flex-col min-h-full px-4 pt-12 pb-10" style={{ background: '#0D1B2E' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-[16px] flex items-center justify-center" style={{ background: '#EFF1F5' }}>
          <UserCircle className="w-5 h-5" style={{ color: '#0D1B2E' }} />
        </div>
        <h1 className="text-xl font-black text-white">Profile</h1>
      </div>

      {/* Profile card */}
      <div className="rounded-[20px] p-5 mb-4 flex items-center gap-4"
        style={{ background: '#EFF1F5' }}>
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
          style={{ background: '#0D1B2E' }}>
          <UserCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="font-black text-lg" style={{ color: '#0D1B2E' }}>SafeNav User</p>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(13,27,46,0.5)' }}>
            <MapPin className="w-3 h-3" /> {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
          </p>
        </div>
      </div>

      {[
        { icon: <Shield className="w-4 h-4" style={{ color: '#0D1B2E' }} />, title: 'Safety Score', value: '78', path: '/score' },
        { icon: <Activity className="w-4 h-4" style={{ color: '#0D1B2E' }} />, title: 'Analytics', value: 'View', path: '/analytics' },
        { icon: <Star className="w-4 h-4" style={{ color: '#0D1B2E' }} />, title: 'Gamification', value: 'Badges', path: '/score' },
      ].map((item, i) => (
        <motion.button key={i} whileTap={{ scale: 0.97 }}
          onClick={() => navigate(item.path)}
          className="w-full rounded-[18px] p-4 flex items-center gap-3 mb-3"
          style={{ background: '#111E30', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: '#EFF1F5' }}>
            {item.icon}
          </div>
          <p className="text-sm font-semibold text-white flex-1 text-left">{item.title}</p>
          <span className="text-xs font-bold" style={{ color: '#4A9EE0' }}>{item.value}</span>
          <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </motion.button>
      ))}
    </div>
  );
}