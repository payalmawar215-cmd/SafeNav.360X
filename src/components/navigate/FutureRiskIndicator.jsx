import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingUp } from 'lucide-react';
import { computeAreaSafetyScore } from '@/lib/riskEngine';

const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const CHECK_INTERVAL = 12000; // 12 seconds

export default function FutureRiskIndicator({ userLocation, route, reports, isNavigating, enabled = true }) {
  const [futureRisk, setFutureRisk] = useState(null); // { label, score, minAhead }
  const [banner, setBanner] = useState(null); // shown only for HIGH/CRITICAL
  const lastAlertRef = useRef(null);
  const lastAlertLocRef = useRef(null);

  useEffect(() => {
    if (!enabled || !route || !route.coords || route.coords.length === 0) {
      setFutureRisk(null);
      return;
    }

    const analyze = () => {
      // Find user's position on route
      const userLat = userLocation.lat;
      const userLng = userLocation.lng;

      // Find closest point on route
      let closestIdx = 0;
      let minDist = Infinity;
      route.coords.forEach(([lat, lng], i) => {
        const d = Math.abs(lat - userLat) + Math.abs(lng - userLng);
        if (d < minDist) { minDist = d; closestIdx = i; }
      });

      // Look 300-600m ahead (~3-5 min walking)
      const aheadIdx = Math.min(closestIdx + 8, route.coords.length - 1);
      const farIdx = Math.min(closestIdx + 15, route.coords.length - 1);

      if (aheadIdx >= route.coords.length) return;

      const [aLat, aLng] = route.coords[aheadIdx];
      const [fLat, fLng] = route.coords[farIdx];

      const nearScore = computeAreaSafetyScore(aLat, aLng, reports, 400);
      const farScore = computeAreaSafetyScore(fLat, fLng, reports, 400);
      const worstScore = Math.min(nearScore, farScore);
      const minAhead = aheadIdx === closestIdx ? 2 : Math.round((aheadIdx - closestIdx) * 0.4);

      if (worstScore >= 75) {
        setFutureRisk(null);
        return;
      }

      const label = worstScore < 35 ? 'High Risk' : worstScore < 60 ? 'Moderate Risk' : 'Mild Risk';
      setFutureRisk({ label, score: worstScore, minAhead: Math.max(2, minAhead) });

      // Only trigger banner for high/critical + cooldown check
      if (worstScore < 40) {
        const now = Date.now();
        const timeSinceLast = now - (lastAlertRef.current || 0);
        const locDiff = lastAlertLocRef.current
          ? Math.abs(lastAlertLocRef.current.lat - userLat) + Math.abs(lastAlertLocRef.current.lng - userLng)
          : 999;

        if (timeSinceLast > COOLDOWN_MS || locDiff > 0.01) {
          lastAlertRef.current = now;
          lastAlertLocRef.current = { lat: userLat, lng: userLng };
          setBanner({ label: `High-risk area ahead in ${Math.max(2, minAhead)} min`, score: worstScore });
          setTimeout(() => setBanner(null), 4000);
        }
      }
    };

    analyze();
    const interval = setInterval(analyze, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [userLocation, route, reports, enabled]);

  return (
    <>
      {/* Passive risk bar — always visible during navigation */}
      <AnimatePresence>
        {isNavigating && futureRisk && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-[60px] left-3 right-3 z-[500] flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: futureRisk.score < 40
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(245,158,11,0.12)',
              border: `1px solid ${futureRisk.score < 40 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: futureRisk.score < 40 ? '#EF4444' : '#F59E0B' }} />
            <p className="text-[11px] font-semibold flex-1" style={{ color: futureRisk.score < 40 ? '#EF4444' : '#F59E0B' }}>
              Ahead: {futureRisk.label} in {futureRisk.minAhead} min
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active alert banner — only HIGH/CRITICAL, auto-dismisses */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-3 left-3 right-3 z-[600] flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: 'rgba(239,68,68,0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
            }}
          >
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <p className="text-sm font-semibold text-white flex-1">{banner.label}</p>
            <button onClick={() => setBanner(null)}>
              <X className="w-4 h-4 text-white/70" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}