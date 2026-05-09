/**
 * SafeNav360X — Hybrid Location Intelligence Engine
 * Multi-source fusion: GPS + WiFi + Cell + Motion + Offline prediction
 */

// ── Source reliability weights ──────────────────────────────
const SOURCE_RELIABILITY = {
  gps:         1.0,
  wifi:        0.78,
  cell:        0.45,
  offline_wifi:0.55,
  predicted:   0.30,
};

// ── Kalman filter state ───────────────────────────────────────
let _kalman = null;
function kalmanUpdate(prev, curr, processNoise = 0.008) {
  if (!prev) return { ...curr, variance: 100 };
  const predicted = {
    lat: prev.lat,
    lng: prev.lng,
    variance: prev.variance + processNoise,
  };
  const measurementVariance = curr.accuracy ? curr.accuracy / 100 : 0.5;
  const K = predicted.variance / (predicted.variance + measurementVariance);
  return {
    lat: predicted.lat + K * (curr.lat - predicted.lat),
    lng: predicted.lng + K * (curr.lng - predicted.lng),
    variance: (1 - K) * predicted.variance,
  };
}

// ── Confidence calculation ────────────────────────────────────
export function calcConfidence(source, accuracy, lastLocation, newLocation) {
  const reliability = SOURCE_RELIABILITY[source] ?? 0.3;

  // Signal quality (lower accuracy meters = better)
  const signalQuality = accuracy
    ? Math.max(0, 1 - accuracy / 200)
    : 0.4;

  // Consistency with last location
  let consistency = 0.8;
  if (lastLocation && newLocation) {
    const dist = haversine(lastLocation.lat, lastLocation.lng, newLocation.lat, newLocation.lng);
    consistency = dist < 50 ? 1.0 : dist < 200 ? 0.8 : dist < 1000 ? 0.5 : 0.2;
  }

  return Math.min(1, (0.5 * reliability) + (0.3 * signalQuality) + (0.2 * consistency));
}

// ── Haversine distance (meters) ───────────────────────────────
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Motion state detection ────────────────────────────────────
const _motion = { lastPos: null, lastTime: null, speed: 0, state: 'stationary' };

export function detectMotionState(currentPos) {
  if (!_motion.lastPos || !_motion.lastTime) {
    _motion.lastPos = currentPos;
    _motion.lastTime = Date.now();
    return { state: 'stationary', speed: 0, heading: 0 };
  }

  const dt = (Date.now() - _motion.lastTime) / 1000; // seconds
  if (dt < 1) return { state: _motion.state, speed: _motion.speed, heading: 0 };

  const dist = haversine(_motion.lastPos.lat, _motion.lastPos.lng, currentPos.lat, currentPos.lng);
  const speed = dist / dt; // m/s

  _motion.speed = speed;
  _motion.state = speed < 0.5 ? 'stationary' : speed < 2.5 ? 'walking' : speed < 15 ? 'cycling' : 'vehicle';

  const dLat = currentPos.lat - _motion.lastPos.lat;
  const dLng = currentPos.lng - _motion.lastPos.lng;
  const heading = Math.atan2(dLng, dLat) * 180 / Math.PI;

  _motion.lastPos = currentPos;
  _motion.lastTime = Date.now();

  return { state: _motion.state, speed, heading };
}

// ── Get tracking interval based on state ─────────────────────
export function getTrackingInterval(motionState, isSOS, batteryLevel = 100) {
  if (isSOS) return 2500; // SOS ultra mode: 2.5s
  if (batteryLevel < 15) {
    // Battery save: reduce all intervals
    return motionState === 'stationary' ? 90000 : motionState === 'walking' ? 30000 : 10000;
  }
  switch (motionState) {
    case 'stationary': return 60000;
    case 'walking':    return 12000;
    case 'cycling':    return 6000;
    case 'vehicle':    return 4000;
    default:           return 15000;
  }
}

// ── Location fusion logic ─────────────────────────────────────
let _pendingReadings = [];
const CONFIDENCE_THRESHOLD = 0.42;
const JUMP_THRESHOLD_M = 120; // > 120m change requires validation

export function fuseLocation({ gps, wifi, cell, offline_wifi, isSOS, lastLocation, batteryLevel = 100 }) {
  let candidate = null;
  let source = 'predicted';

  if (isSOS) {
    // SOS: use most accurate available
    if (gps && gps.accuracy < 80) { candidate = gps; source = 'gps'; }
    else if (wifi) { candidate = wifi; source = 'wifi'; }
    else if (gps) { candidate = gps; source = 'gps'; }
    else if (cell) { candidate = cell; source = 'cell'; }
  } else {
    if (gps && gps.accuracy < 20) { candidate = gps; source = 'gps'; }
    else if (wifi) { candidate = wifi; source = 'wifi'; }
    else if (offline_wifi) { candidate = offline_wifi; source = 'offline_wifi'; }
    else if (cell) { candidate = cell; source = 'cell'; }
    else if (gps) { candidate = gps; source = 'gps'; } // fallback
  }

  // Dead reckoning prediction if nothing available
  if (!candidate && lastLocation) {
    const motion = detectMotionState(lastLocation);
    const dt = 15; // seconds since last known
    const distM = motion.speed * dt;
    const dLat = (distM / 111320) * Math.cos(motion.heading * Math.PI / 180);
    const dLng = distM / (111320 * Math.cos(lastLocation.lat * Math.PI / 180));
    candidate = {
      lat: lastLocation.lat + dLat,
      lng: lastLocation.lng + dLng,
      accuracy: 150,
    };
    source = 'predicted';
  }

  if (!candidate) return null;

  const confidence = calcConfidence(source, candidate.accuracy, lastLocation, candidate);

  // Anti-jump: validate large movements
  if (lastLocation && !isSOS) {
    const dist = haversine(lastLocation.lat, lastLocation.lng, candidate.lat, candidate.lng);
    if (dist > JUMP_THRESHOLD_M) {
      _pendingReadings.push(candidate);
      if (_pendingReadings.length < 2) return null; // wait for confirmation
      _pendingReadings = [];
    }
  }

  if (confidence < CONFIDENCE_THRESHOLD && !isSOS) return null;

  // Kalman smooth
  const smoothed = kalmanUpdate(_kalman, candidate, 0.005);
  _kalman = smoothed;

  return {
    lat: smoothed.lat,
    lng: smoothed.lng,
    accuracy: candidate.accuracy || 50,
    source,
    confidence: Math.round(confidence * 100) / 100,
    speed: _motion.speed || 0,
    heading: 0,
    timestamp: Date.now(),
  };
}

// ── SOS location payload builder ──────────────────────────────
export function buildSOSPayload(location, batteryLevel, userId) {
  return {
    userId,
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    confidence: location.confidence,
    source: location.source,
    speed: location.speed,
    battery: batteryLevel,
    timestamp: new Date().toISOString(),
  };
}

// ── Offline: motion-based prediction ─────────────────────────
export function predictNextLocation(lastLocation, motionState, secondsAhead = 10) {
  if (!lastLocation || motionState.state === 'stationary') return lastLocation;
  const distM = motionState.speed * secondsAhead;
  const headingRad = (motionState.heading || 0) * Math.PI / 180;
  return {
    lat: lastLocation.lat + (distM / 111320) * Math.cos(headingRad),
    lng: lastLocation.lng + (distM / (111320 * Math.cos(lastLocation.lat * Math.PI / 180))) * Math.sin(headingRad),
    accuracy: 200,
    source: 'predicted',
    confidence: 0.30,
    timestamp: Date.now(),
  };
}