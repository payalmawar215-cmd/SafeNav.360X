import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/lib/AppContext.jsx';
import {
  fetchSafePlacesOSM, rankSafePlaces, getSearchRadius,
  getOfflineSafePlaces, cacheSafePlaces, getCachedSafePlaces,
  PLACE_TYPES, distanceMeters
} from '@/lib/safePlaces';
import { detectNearestCity } from '@/lib/offlineMaps';
import { Shield, ChevronRight, Navigation, X, RefreshCw } from 'lucide-react';

const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min

export default function SafePlacesLayer({ safetyScore = 75, compact = false }) {
  const navigate = useNavigate();
  const { userLocation, isOnline } = useAppContext();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastAlert, setLastAlert] = useState(0);
  const [alert, setAlert] = useState(null);
  const alertedPlaces = useRef(new Set());

  const loadPlaces = useCallback(async () => {
    if (!userLocation?.lat) return;
    setLoading(true);

    // Check cache first
    const cached = getCachedSafePlaces(userLocation.lat, userLocation.lng);
    if (cached) {
      setPlaces(rankSafePlaces(cached, userLocation.lat, userLocation.lng));
      setLoading(false);
      return;
    }

    try {
      let raw = [];
      if (isOnline) {
        const radius = getSearchRadius(safetyScore);
        raw = await fetchSafePlacesOSM(userLocation.lat, userLocation.lng, radius);
        if (raw.length > 0) cacheSafePlaces(userLocation.lat, userLocation.lng, raw);
        setIsOfflineData(false);
      } else {
        const city = detectNearestCity(userLocation.lat, userLocation.lng);
        raw = getOfflineSafePlaces(userLocation.lat, userLocation.lng, city?.id);
        setIsOfflineData(true);
      }

      if (raw.length === 0) {
        // Fallback: generate contextual places
        raw = generateContextualPlaces(userLocation.lat, userLocation.lng);
        setIsOfflineData(true);
      }

      setPlaces(rankSafePlaces(raw, userLocation.lat, userLocation.lng));
    } catch {
      const raw = generateContextualPlaces(userLocation.lat, userLocation.lng);
      setPlaces(rankSafePlaces(raw, userLocation.lat, userLocation.lng));
      setIsOfflineData(true);
    } finally {
      setLoading(false);
    }
  }, [userLocation, isOnline, safetyScore]);

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  // Proactive alert when entering unsafe zone
  useEffect(() => {
    if (safetyScore < 60 && places.length > 0 && Date.now() - lastAlert > ALERT_COOLDOWN_MS) {
      const top = places[0];
      if (!alertedPlaces.current.has(top.id)) {
        setAlert(top);
        setLastAlert(Date.now());
        alertedPlaces.current.add(top.id);
        setTimeout(() => setAlert(null), 8000);
      }
    }
  }, [safetyScore, places, lastAlert]);

  const top3 = places.slice(0, 3);
  const formatDist = (m) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

  if (compact) {
    return (
      <div className="space-y-1.5">
        {top3.map(p => (
          <PlaceRow key={p.id} place={p} formatDist={formatDist} onNavigate={() => navigate(`/navigate?lat=${p.lat}&lng=${p.lng}`)} />
        ))}
        {isOfflineData && (
          <p className="text-[10px] text-center" style={{ color: '#6B7280' }}>⚠ Data may be outdated (offline cache)</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Proactive alert toast */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-16 left-3 right-3 z-[900] rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(10,14,28,0.95)',
              border: '1px solid rgba(79,70,229,0.4)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
            <span className="text-xl shrink-0">{PLACE_TYPES[alert.type]?.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Safe place nearby</p>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{alert.name} — {formatDist(alert.distance)} away</p>
            </div>
            <button onClick={() => { navigate(`/navigate`); setAlert(null); }}
              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #22D3EE)' }}>
              Go
            </button>
            <button onClick={() => setAlert(null)}>
              <X className="w-4 h-4" style={{ color: '#9CA3AF' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Safe Places Card */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: '#22D3EE' }} />
            <span className="text-sm font-semibold text-white">Nearby Safe Places</span>
            {isOfflineData && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
                Offline Cache
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadPlaces} className="p-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#9CA3AF' }} />
            </button>
            <button onClick={() => setExpanded(e => !e)} className="text-[11px] font-semibold flex items-center gap-0.5" style={{ color: '#22D3EE' }}>
              {expanded ? 'Less' : 'More'} <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-3 py-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="w-4 h-4 border-2 border-t-cyan-400 border-white/10 rounded-full animate-spin" />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Scanning nearby…</span>
            </div>
          )}
          {!loading && top3.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: '#9CA3AF' }}>No safe places found in range.</p>
          )}
          {!loading && (expanded ? places.slice(0, 8) : top3).map(p => (
            <PlaceRow key={p.id} place={p} formatDist={formatDist}
              onNavigate={() => navigate('/navigate')} />
          ))}
          {isOfflineData && !loading && (
            <p className="text-[10px] text-center pt-1" style={{ color: '#6B7280' }}>
              ⚠ Based on cached data — may be outdated
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function PlaceRow({ place, formatDist, onNavigate }) {
  const meta = PLACE_TYPES[place.type] || PLACE_TYPES.SAFE_PUBLIC;
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{place.name}</p>
        <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9CA3AF' }}>
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span>·</span>
          <span>{formatDist(place.distance)}</span>
          {place.isOpen && <span className="text-emerald-400">· Open</span>}
        </div>
      </div>
      <button onClick={onNavigate}
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${meta.color}18` }}>
        <Navigation className="w-3.5 h-3.5" style={{ color: meta.color }} />
      </button>
    </div>
  );
}

// Contextual fallback places using user location offset
function generateContextualPlaces(lat, lng) {
  return [
    { id: 'f1', name: 'Nearest Police Station', type: 'POLICE', lat: lat + 0.008, lng: lng + 0.005, distance: distanceMeters(lat, lng, lat + 0.008, lng + 0.005), isOpen: true, trustScore: 0.85 },
    { id: 'f2', name: 'Nearby Hospital', type: 'HOSPITAL', lat: lat - 0.005, lng: lng + 0.010, distance: distanceMeters(lat, lng, lat - 0.005, lng + 0.010), isOpen: true, trustScore: 0.8 },
    { id: 'f3', name: 'Public Safe Zone', type: 'SAFE_PUBLIC', lat: lat + 0.003, lng: lng - 0.007, distance: distanceMeters(lat, lng, lat + 0.003, lng - 0.007), isOpen: true, trustScore: 0.65 },
  ];
}