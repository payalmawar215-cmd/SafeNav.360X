import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SOSButton from '@/components/sos/SOSButton';
import OfflineBanner from '@/components/common/OfflineBanner';
import VoiceActivation from '@/components/sos/VoiceActivation';
import StealthMode from '@/components/sos/StealthMode';
import SafeBuddy from '@/components/ai/SafeBuddy';
import CriticalAlertOverlay from '@/components/notifications/CriticalAlertOverlay';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppContext } from '@/lib/AppContext.jsx';
import { calculateSafetyScore } from '@/lib/mockData';

export default function AppLayout() {
  const { stealthMode, setStealthMode, userLocation } = useAppContext();
  const isNight = new Date().getHours() >= 19 || new Date().getHours() < 6;
  const areaScore = calculateSafetyScore(isNight ? 'night' : 'day', 72, 65, 58);
  const { activeAlert, dismissActiveAlert } = useNotifications({ userLocation, areaScore, isNight });

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto relative" style={{ background: '#0D1B2E' }}>
      <OfflineBanner />
      <VoiceActivation />
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <SOSButton />
      <SafeBuddy />
      <CriticalAlertOverlay alert={activeAlert} onDismiss={dismissActiveAlert} />
      <BottomNav />
      {stealthMode && <StealthMode onClose={() => setStealthMode(false)} />}
    </div>
  );
}