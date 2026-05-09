// Safe Places Detection Engine

export const PLACE_TYPES = {
  POLICE: { label: 'Police Station', icon: '🚓', color: '#3B82F6', badge: 'bg-blue-500' },
  WOMEN_POLICE: { label: "Women's Police", icon: '👮‍♀️', color: '#EC4899', badge: 'bg-pink-500' },
  HOSPITAL: { label: 'Hospital', icon: '🏥', color: '#EF4444', badge: 'bg-red-500' },
  EMERGENCY_CLINIC: { label: 'Emergency Clinic', icon: '🩺', color: '#F97316', badge: 'bg-orange-500' },
  NGO_SUPPORT: { label: 'NGO / Support', icon: '🛡️', color: '#10B981', badge: 'bg-emerald-500' },
  SAFE_PUBLIC: { label: 'Safe Public Place', icon: '🏬', color: '#8B5CF6', badge: 'bg-violet-500' },
};

const OSM_QUERY_MAP = {
  POLICE: 'amenity=police',
  HOSPITAL: 'amenity=hospital',
  EMERGENCY_CLINIC: 'amenity=clinic',
  SAFE_PUBLIC: 'amenity=marketplace|building=mall',
};

// Distance in meters between two lat/lng
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch safe places from Overpass API (OSM)
export async function fetchSafePlacesOSM(lat, lng, radiusMeters = 2000) {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="police"](around:${radiusMeters},${lat},${lng});
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["amenity"="pharmacy"](around:${radiusMeters},${lat},${lng});
      node["building"="mall"](around:${radiusMeters},${lat},${lng});
      node["amenity"="police_station"](around:${radiusMeters},${lat},${lng});
    );
    out body;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  const data = await res.json();
  return (data.elements || []).map(el => {
    let type = 'SAFE_PUBLIC';
    const a = el.tags?.amenity || '';
    if (a === 'police' || a === 'police_station') type = 'POLICE';
    else if (a === 'hospital') type = 'HOSPITAL';
    else if (a === 'clinic' || a === 'pharmacy') type = 'EMERGENCY_CLINIC';

    const dist = distanceMeters(lat, lng, el.lat, el.lon);
    return {
      id: String(el.id),
      name: el.tags?.name || PLACE_TYPES[type].label,
      type,
      lat: el.lat,
      lng: el.lon,
      distance: dist,
      isOpen: true,
      trustScore: type === 'POLICE' || type === 'HOSPITAL' ? 0.9 : 0.7,
      source: 'osm',
    };
  });
}

// Rank safe places using the scoring formula
export function rankSafePlaces(places, userLat, userLng) {
  const maxDist = Math.max(...places.map(p => p.distance), 1);
  return places
    .map(p => {
      const distScore = 1 - p.distance / maxDist;
      const availScore = p.isOpen ? 1 : 0.3;
      const trustScore = p.trustScore || 0.7;
      const crowdScore = p.type === 'POLICE' || p.type === 'HOSPITAL' ? 0.9 : 0.6;
      const rank = 0.4 * distScore + 0.3 * availScore + 0.2 * trustScore + 0.1 * crowdScore;
      return { ...p, rank };
    })
    .sort((a, b) => b.rank - a.rank);
}

// Get dynamic radius based on safety score
export function getSearchRadius(safetyScore) {
  if (safetyScore < 40) return 1000;
  if (safetyScore < 60) return 2000;
  return 3000;
}

// Offline fallback safe places (from cached city data)
export function getOfflineSafePlaces(lat, lng, cityId) {
  const raw = localStorage.getItem(`safenav_safety_${cityId}`);
  if (!raw) return [];
  const meta = JSON.parse(raw);
  return (meta.safePlaces || []).map(p => ({
    ...p,
    id: `offline_${p.name}`,
    distance: distanceMeters(lat, lng, p.lat, p.lng),
    isOpen: true,
    source: 'offline',
  }));
}

// Cache safe places to localStorage
export function cacheSafePlaces(lat, lng, places) {
  const key = `safenav_safeplaces_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  localStorage.setItem(key, JSON.stringify({ places, cachedAt: Date.now() }));
}

export function getCachedSafePlaces(lat, lng) {
  const key = `safenav_safeplaces_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const { places, cachedAt } = JSON.parse(raw);
  if (Date.now() - cachedAt > 30 * 60 * 1000) return null; // 30 min TTL
  return places;
}