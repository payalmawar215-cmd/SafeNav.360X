// Offline Maps Manager — IndexedDB + tile caching via Cache API

const CACHE_NAME = 'safenav-tiles-v1';
const META_KEY = 'safenav_offline_cities';

// City bounding boxes and metadata
export const CITY_DATA = [
  { id: 'delhi', name: 'New Delhi', bbox: [28.40, 76.84, 28.88, 77.35], sizeMB: 52 },
  { id: 'mumbai', name: 'Mumbai', bbox: [18.89, 72.77, 19.27, 72.98], sizeMB: 48 },
  { id: 'bangalore', name: 'Bangalore', bbox: [12.83, 77.46, 13.14, 77.78], sizeMB: 44 },
  { id: 'hyderabad', name: 'Hyderabad', bbox: [17.27, 78.29, 17.55, 78.62], sizeMB: 41 },
  { id: 'chennai', name: 'Chennai', bbox: [12.90, 80.17, 13.23, 80.31], sizeMB: 38 },
  { id: 'kolkata', name: 'Kolkata', bbox: [22.44, 88.27, 22.63, 88.47], sizeMB: 36 },
  { id: 'pune', name: 'Pune', bbox: [18.42, 73.76, 18.62, 73.98], sizeMB: 35 },
  { id: 'indore', name: 'Indore', bbox: [22.60, 75.75, 22.82, 76.00], sizeMB: 28 },
  { id: 'jaipur', name: 'Jaipur', bbox: [26.78, 75.70, 27.00, 75.95], sizeMB: 30 },
  { id: 'lucknow', name: 'Lucknow', bbox: [26.75, 80.82, 26.97, 81.08], sizeMB: 27 },
  { id: 'ahmedabad', name: 'Ahmedabad', bbox: [22.93, 72.49, 23.11, 72.71], sizeMB: 33 },
  { id: 'surat', name: 'Surat', bbox: [21.10, 72.77, 21.27, 72.95], sizeMB: 25 },
];

// Detect nearest city from lat/lng
export function detectNearestCity(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const city of CITY_DATA) {
    const [s, w, n, e] = city.bbox;
    const cLat = (s + n) / 2, cLng = (w + e) / 2;
    const dist = Math.sqrt((lat - cLat) ** 2 + (lng - cLng) ** 2);
    if (dist < minDist) { minDist = dist; nearest = city; }
  }
  return nearest;
}

// Get downloaded cities list from localStorage
export function getDownloadedCities() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '[]'); }
  catch { return []; }
}

function saveDownloadedCities(list) {
  localStorage.setItem(META_KEY, JSON.stringify(list));
}

// Check if a city is downloaded
export function isCityDownloaded(cityId) {
  return getDownloadedCities().some(c => c.id === cityId);
}

// Simulate downloading city map data (pre-cache OSM tile URLs for bbox)
export async function downloadCityMap(city, onProgress) {
  const [s, w, n, e] = city.bbox;
  const zoom = 14;
  const tileUrls = [];

  // Generate tile URLs for bbox at zoom 14
  const lat2tile = (lat, z) => Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
  const lng2tile = (lng, z) => Math.floor((lng + 180) / 360 * Math.pow(2, z));

  const tileX1 = lng2tile(w, zoom), tileX2 = lng2tile(e, zoom);
  const tileY1 = lat2tile(n, zoom), tileY2 = lat2tile(s, zoom);

  for (let x = tileX1; x <= Math.min(tileX2, tileX1 + 15); x++) {
    for (let y = tileY1; y <= Math.min(tileY2, tileY1 + 15); y++) {
      tileUrls.push(`https://a.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
    }
  }

  // Also cache zoom 12 overview tiles
  const z12 = 12;
  const tx1 = lng2tile(w, z12), tx2 = lng2tile(e, z12);
  const ty1 = lat2tile(n, z12), ty2 = lat2tile(s, z12);
  for (let x = tx1; x <= tx2; x++) {
    for (let y = ty1; y <= ty2; y++) {
      tileUrls.push(`https://a.tile.openstreetmap.org/${z12}/${x}/${y}.png`);
    }
  }

  const cache = await caches.open(CACHE_NAME);
  let done = 0;

  // Batch fetch with progress
  const batchSize = 8;
  for (let i = 0; i < tileUrls.length; i += batchSize) {
    const batch = tileUrls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async url => {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) await cache.put(url, res);
        } catch { /* skip failed tiles */ }
      })
    );
    done += batch.length;
    onProgress?.(Math.min(100, Math.round((done / tileUrls.length) * 100)));
    await new Promise(r => setTimeout(r, 10)); // breathing room
  }

  // Save safety metadata locally
  const safetyMeta = generateOfflineSafetyMeta(city);
  localStorage.setItem(`safenav_safety_${city.id}`, JSON.stringify(safetyMeta));

  // Mark as downloaded
  const list = getDownloadedCities().filter(c => c.id !== city.id);
  list.push({ id: city.id, name: city.name, downloadedAt: new Date().toISOString(), sizeMB: city.sizeMB });
  saveDownloadedCities(list);
  return true;
}

// Delete cached city
export async function deleteCityMap(cityId) {
  const city = CITY_DATA.find(c => c.id === cityId);
  if (!city) return;
  localStorage.removeItem(`safenav_safety_${cityId}`);
  const list = getDownloadedCities().filter(c => c.id !== cityId);
  saveDownloadedCities(list);
}

// Generate mock offline safety metadata
function generateOfflineSafetyMeta(city) {
  return {
    cityId: city.id,
    generatedAt: new Date().toISOString(),
    lightingZones: [
      { lat: (city.bbox[0] + city.bbox[2]) / 2 + 0.02, lng: (city.bbox[1] + city.bbox[3]) / 2, radius: 500, score: 85, label: 'Well-lit main road' },
      { lat: (city.bbox[0] + city.bbox[2]) / 2 - 0.01, lng: (city.bbox[1] + city.bbox[3]) / 2 + 0.01, radius: 300, score: 40, label: 'Poor lighting area' },
    ],
    crowdDensity: {
      label: 'Based on Historical Trends',
      byHour: { '6': 0.4, '8': 0.8, '12': 0.9, '18': 0.85, '20': 0.6, '22': 0.3, '0': 0.1 },
    },
    safePlaces: [
      { name: `${city.name} Police HQ`, type: 'POLICE', lat: (city.bbox[0] + city.bbox[2]) / 2, lng: (city.bbox[1] + city.bbox[3]) / 2 + 0.02, trustScore: 0.95 },
      { name: `${city.name} General Hospital`, type: 'HOSPITAL', lat: (city.bbox[0] + city.bbox[2]) / 2 + 0.015, lng: (city.bbox[1] + city.bbox[3]) / 2 - 0.01, trustScore: 0.9 },
    ],
  };
}

// Offline safety score calculator
export function calculateOfflineSafetyScore(lat, lng, cityId) {
  const raw = localStorage.getItem(`safenav_safety_${cityId}`);
  if (!raw) return { score: 60, label: 'Based on Historical Trends', isOffline: true };

  const meta = JSON.parse(raw);
  const hour = String(new Date().getHours());
  const crowd = meta.crowdDensity.byHour[hour] || 0.5;

  let lightingScore = 70;
  for (const zone of meta.lightingZones) {
    const dist = Math.sqrt((lat - zone.lat) ** 2 + (lng - zone.lng) ** 2) * 111000;
    if (dist < zone.radius) { lightingScore = zone.score; break; }
  }

  const finalScore = Math.round(lightingScore * 0.5 + crowd * 100 * 0.5);
  return { score: Math.min(100, Math.max(10, finalScore)), label: 'Based on Historical Trends', isOffline: true };
}