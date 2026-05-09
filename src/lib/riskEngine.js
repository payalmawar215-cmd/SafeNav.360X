/**
 * SafeNav360X – AI Risk Prediction Engine
 * Scores routes and areas based on:
 *  - Community report density (with trust-score weighting)
 *  - Time of day (night penalty)
 *  - Unsafe zone proximity
 *  - Report type severity
 */

import { UNSAFE_ZONES } from './mockData';

const TYPE_SEVERITY = {
  harassment: 1.0,
  unsafe_street: 0.7,
  suspicious: 0.6,
  poor_lighting: 0.5,
  other: 0.3,
};

/** Haversine-like approximation in meters */
function distMeters(lat1, lng1, lat2, lng2) {
  const dlat = (lat1 - lat2) * 111320;
  const dlng = (lng1 - lng2) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/**
 * Compute safety score (0-100) for a given lat/lng from live reports.
 * Higher score = safer.
 * @param {number} lat
 * @param {number} lng
 * @param {Array} reports - IncidentReport[] from backend
 * @param {number} radiusMeters - area of influence
 */
export function computeAreaSafetyScore(lat, lng, reports = [], radiusMeters = 800) {
  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;

  // Base score
  let score = 100;

  // Penalty from unsafe zones
  for (const zone of UNSAFE_ZONES) {
    const timeOk = !zone.timeRestriction || (zone.timeRestriction === 'night' && isNight);
    if (!timeOk) continue;
    const dist = distMeters(lat, lng, zone.lat, zone.lng);
    if (dist < zone.radius) {
      const severityPenalty = zone.severity === 'high' ? 25 : zone.severity === 'medium' ? 15 : 8;
      score -= severityPenalty * (1 - dist / zone.radius);
    }
  }

  // Penalty from community reports (trust-weighted)
  const nearbyReports = reports.filter(r => {
    if (!r.lat || !r.lng) return false;
    return distMeters(lat, lng, r.lat, r.lng) <= radiusMeters;
  });

  for (const report of nearbyReports) {
    const typeMult = TYPE_SEVERITY[report.type] || 0.3;
    const trustMult = (report.trust_score || 50) / 100;
    const dist = distMeters(lat, lng, report.lat, report.lng);
    const distDecay = Math.max(0, 1 - dist / radiusMeters);
    score -= typeMult * trustMult * distDecay * 12;
  }

  // Night penalty
  if (isNight) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Score each coordinate in a route polyline, return overall route safety.
 * Samples every Nth point for performance.
 * @param {Array<[lat,lng]>} coords
 * @param {Array} reports
 */
export function scoreRoute(coords, reports = []) {
  if (!coords || coords.length === 0) return 75;
  const step = Math.max(1, Math.floor(coords.length / 15));
  const samples = coords.filter((_, i) => i % step === 0);
  const scores = samples.map(([lat, lng]) => computeAreaSafetyScore(lat, lng, reports, 500));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg);
}

/**
 * Returns route highlights based on score.
 */
export function getRouteHighlights(score, type) {
  if (type === 'safest') {
    return score >= 85
      ? ['Well-lit roads', 'CCTV coverage', 'Police patrol zone']
      : ['Moderate lighting', 'Some coverage', 'Busy road'];
  }
  if (type === 'balanced') {
    return ['Mixed lighting', 'Some dark patches', 'Market area'];
  }
  return ['Narrow lanes', 'Poor lighting', 'Isolated stretch'];
}