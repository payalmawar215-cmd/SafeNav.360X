import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Share2, Volume2, VolumeX, Layers } from 'lucide-react';
import SafetyBadge from '@/components/common/SafetyBadge';
import UserLocationMarker from './UserLocationMarker';
import RoutePolylines from './RoutePolylines';
import SafetyHeatmap from './SafetyHeatmap';
import FutureRiskIndicator from './FutureRiskIndicator';
import VoiceGuide from './VoiceGuide';
import { MapFollowUser } from './MapController';
import { useAppContext } from '@/lib/AppContext.jsx';
import { computeAreaSafetyScore } from '@/lib/riskEngine';

const ROUTE_COLORS = { safest: '#10B981', balanced: '#F59E0B', fastest: '#EF4444' };
const ROUTE_LABELS = { safest: 'Safest', balanced: 'Balanced', fastest: 'Fastest' };

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function NavigationMode({ route, destination, routeType, reports, onEnd, onReroute }) {
  const { userLocation, setIsTracking, contacts } = useAppContext();
  const [eta, setEta] = useState(route.dur);
  const [dist, setDist] = useState(route.dist);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  const [riskAlert, setRiskAlert] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState('Navigation started');
  const [followUser, setFollowUser] = useState(true);
  const [saferRouteShown, setSaferRouteShown] = useState(false);
  const [showSaferBanner, setShowSaferBanner] = useState(false);
  const alertCooldownRef = useRef(null);
  const color = ROUTE_COLORS[routeType];

  useEffect(() => {
    setIsTracking(true);
    const etaTimer = setInterval(() => setEta(p => Math.max(0, p - 1)), 15000);
    return () => { clearInterval(etaTimer); setIsTracking(false); };
  }, []);

  // Real-time safety monitoring
  useEffect(() => {
    const monitor = setInterval(() => {
      const score = computeAreaSafetyScore(userLocation.lat, userLocation.lng, reports, 400);
      if (score < 35 && !alertCooldownRef.current) {
        const alert = { level: 'HIGH', message: 'Warning: entering unsafe area ahead. Stay alert.' };
        setRiskAlert(alert);
        alertCooldownRef.current = setTimeout(() => {
          setRiskAlert(null);
          alertCooldownRef.current = null;
        }, 90000);

        // Suggest safer route only once
        if (routeType !== 'safest' && !saferRouteShown) {
          setSaferRouteShown(true);
          setShowSaferBanner(true);
          setTimeout(() => setShowSaferBanner(false), 5000);
        }
      }
    }, 8000);
    return () => clearInterval(monitor);
  }, [userLocation, reports, routeType, saferRouteShown]);

  // Share live location with contacts every 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const locUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
      // Update location silently — no spam to contacts during nav
    }, 12000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const destIcon = L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,0.7)"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });

  return (
    <div className="fixed inset-0 z-[900] flex flex-col" style={{ background: '#0B0F1A' }}>
      <VoiceGuide
        enabled={voiceEnabled}
        language="en-IN"
        instruction={currentInstruction}
        riskAlert={riskAlert}
        routeType={routeType}
      />

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between z-[1000] shrink-0"
        style={{ background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">{ROUTE_LABELS[routeType]} Route</p>
              <div className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                ● LIVE
              </div>
            </div>
            <p className="text-xs truncate max-w-[200px]" style={{ color: '#9CA3AF' }}>{destination?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(v => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: voiceEnabled ? 'rgba(79,70,229,0.15)' : 'rgba(255,255,255,0.06)', color: voiceEnabled ? '#818CF8' : '#6B7280' }}>
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setHeatmapVisible(h => !h)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: heatmapVisible ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: heatmapVisible ? '#EF4444' : '#6B7280' }}>
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={onEnd}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]} zoom={16}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapFollowUser position={userLocation} follow={followUser} />
          <UserLocationMarker position={userLocation} />
          <RoutePolylines
            routes={{ [routeType]: route }}
            selectedRoute={routeType}
            reports={reports}
            onSelectRoute={() => {}}
          />
          <SafetyHeatmap reports={reports} visible={heatmapVisible} />
        </MapContainer>

        {/* Future risk passive bar + critical banners */}
        <FutureRiskIndicator
          userLocation={userLocation}
          route={route}
          reports={reports}
          isNavigating={true}
          enabled={true}
        />

        {/* Safer route banner (shown once only) */}
        <AnimatePresence>
          {showSaferBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-16 left-3 right-3 z-[600] px-4 py-3 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(12px)' }}>
              <Navigation className="w-4 h-4 text-white shrink-0" />
              <p className="text-sm font-semibold text-white flex-1">Safer route available</p>
              <button onClick={() => { setShowSaferBanner(false); onReroute('safest'); }}
                className="text-[11px] font-bold px-3 py-1 rounded-xl bg-white/20 text-white">
                Switch
              </button>
              <button onClick={() => setShowSaferBanner(false)}>
                <X className="w-4 h-4 text-white/70" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to unfollow notice */}
        <button
          onClick={() => setFollowUser(f => !f)}
          className="absolute bottom-24 right-3 z-[500] w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            background: followUser ? 'rgba(79,70,229,0.9)' : 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
          }}>
          <Navigation className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Bottom HUD */}
      <div className="px-4 pt-3 pb-4 shrink-0"
        style={{ background: 'rgba(11,15,26,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* ETA row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{eta}</span>
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{dist} km remaining</p>
            </div>
            <SafetyBadge score={route.score} size="sm" />
          </div>
          <button
            onClick={() => {
              const locUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
              if (navigator.share) navigator.share({ title: 'Live Location', url: locUrl });
              else navigator.clipboard.writeText(locUrl);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22D3EE' }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button onClick={() => onReroute(routeType)}
            className="flex-1 h-10 rounded-2xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E5E7EB' }}>
            ↻ Re-route
          </button>
          <button onClick={onEnd}
            className="flex-1 h-10 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444' }}>
            <X className="w-3.5 h-3.5" /> End Navigation
          </button>
        </div>
      </div>
    </div>
  );
}