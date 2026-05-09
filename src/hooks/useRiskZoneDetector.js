import { useEffect, useRef, useState } from 'react';
import { UNSAFE_ZONES } from '@/lib/mockData';

const DEG_PER_METER = 1 / 111320;

function distanceMeters(lat1, lng1, lat2, lng2) {
  const dlat = (lat1 - lat2) * 111320;
  const dlng = (lng1 - lng2) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/**
 * Detects if userLocation is inside any unsafe zone.
 * Returns { inRiskZone, zone } when triggered, null otherwise.
 * Fires onEnter callback only once per zone entry (debounced).
 */
export function useRiskZoneDetector(userLocation, onEnter) {
  const [activeZone, setActiveZone] = useState(null);
  const lastZoneId = useRef(null);
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  useEffect(() => {
    if (!userLocation) return;

    const hit = UNSAFE_ZONES.find(zone => {
      const timeOk = !zone.timeRestriction || (zone.timeRestriction === 'night' && isNight);
      if (!timeOk) return false;
      const dist = distanceMeters(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
      return dist <= zone.radius;
    });

    if (hit) {
      setActiveZone(hit);
      if (hit.id !== lastZoneId.current) {
        lastZoneId.current = hit.id;
        onEnter && onEnter(hit);
      }
    } else {
      setActiveZone(null);
      lastZoneId.current = null;
    }
  }, [userLocation?.lat, userLocation?.lng]);

  return activeZone;
}