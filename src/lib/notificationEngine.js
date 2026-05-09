/**
 * SafeNav360X — Global Notification System Engine
 * Priority-based, context-aware, anti-spam notification hub
 */
import { haversine } from './locationEngine';

// ── Priority levels ───────────────────────────────────────────
export const PRIORITY = {
  CRITICAL: 4,
  HIGH:     3,
  MEDIUM:   2,
  LOW:      1,
};

export const PRIORITY_LABELS = {
  4: 'Critical',
  3: 'High',
  2: 'Medium',
  1: 'Low',
};

// ── Notification types ────────────────────────────────────────
export const NOTIF_TYPES = {
  SOS_TRIGGERED:     { priority: PRIORITY.CRITICAL, icon: '🚨', color: '#EF4444' },
  ACCIDENT_NEARBY:   { priority: PRIORITY.CRITICAL, icon: '🚗', color: '#EF4444' },
  DANGER_ZONE:       { priority: PRIORITY.CRITICAL, icon: '⚠️', color: '#EF4444' },
  CRIME_NEARBY:      { priority: PRIORITY.HIGH,     icon: '🔴', color: '#F59E0B' },
  UNSAFE_ROUTE:      { priority: PRIORITY.HIGH,     icon: '🛣️', color: '#F59E0B' },
  POOR_LIGHTING:     { priority: PRIORITY.HIGH,     icon: '💡', color: '#F59E0B' },
  CROWD_SURGE:       { priority: PRIORITY.HIGH,     icon: '👥', color: '#F59E0B' },
  SAFETY_SCORE_LOW:  { priority: PRIORITY.MEDIUM,   icon: '🛡️', color: '#6366F1' },
  SAFE_PLACE_NEARBY: { priority: PRIORITY.MEDIUM,   icon: '🏥', color: '#10B981' },
  SAFETY_TIP:        { priority: PRIORITY.MEDIUM,   icon: 'ℹ️', color: '#6366F1' },
  APP_UPDATE:        { priority: PRIORITY.LOW,      icon: '📱', color: '#9CA3AF' },
  WEEKLY_SUMMARY:    { priority: PRIORITY.LOW,      icon: '📊', color: '#9CA3AF' },
};

// ── Cooldown registry ─────────────────────────────────────────
const _cooldowns = {}; // key -> lastFiredAt (ms)
const COOLDOWN_RULES = {
  [PRIORITY.CRITICAL]: 5 * 60 * 1000,   // 5 min
  [PRIORITY.HIGH]:     30 * 60 * 1000,  // 30 min
  [PRIORITY.MEDIUM]:   60 * 60 * 1000,  // 1 hour
  [PRIORITY.LOW]:      24 * 60 * 60 * 1000, // 1 day
};

function cooldownKey(type, locationKey) {
  return `${type}::${locationKey || 'global'}`;
}

function isOnCooldown(type, locationKey) {
  const key = cooldownKey(type, locationKey);
  const last = _cooldowns[key];
  if (!last) return false;
  const meta = NOTIF_TYPES[type];
  const cooldown = COOLDOWN_RULES[meta?.priority ?? PRIORITY.MEDIUM];
  return Date.now() - last < cooldown;
}

function setCooldown(type, locationKey) {
  _cooldowns[cooldownKey(type, locationKey)] = Date.now();
}

// ── Quiet hours ───────────────────────────────────────────────
let _quietHours = null; // { start: 22, end: 7 }

export function setQuietHours(start, end) {
  _quietHours = { start, end };
}

function isQuietHour(priority) {
  if (priority === PRIORITY.CRITICAL) return false; // always fire
  if (!_quietHours) return false;
  const h = new Date().getHours();
  const { start, end } = _quietHours;
  const inQuiet = start > end
    ? (h >= start || h < end)
    : (h >= start && h < end);
  return inQuiet;
}

// ── Smart relevance filter ────────────────────────────────────
export function isRelevant({ userLocation, eventLocation, radius = 1500, userActivity = 'idle', type }) {
  if (!userLocation || !eventLocation) return false;

  // Route-aware: only check distance for now (full route-aware requires nav state)
  const dist = haversine(userLocation.lat, userLocation.lng, eventLocation.lat, eventLocation.lng);

  // Adjust radius by activity
  const effectiveRadius = userActivity === 'vehicle' ? radius * 2
    : userActivity === 'walking' ? radius * 0.7
    : radius;

  return dist <= effectiveRadius;
}

// ── Core notification factory ─────────────────────────────────
let _listeners = [];
let _notifHistory = []; // in-memory store (also write to localStorage)
const MAX_HISTORY = 100;

export function subscribeToNotifications(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function broadcastNotification(notif) {
  _listeners.forEach(fn => fn(notif));
  _notifHistory.unshift(notif);
  if (_notifHistory.length > MAX_HISTORY) _notifHistory = _notifHistory.slice(0, MAX_HISTORY);
  try {
    const stored = JSON.parse(localStorage.getItem('safenav_notifs') || '[]');
    stored.unshift(notif);
    localStorage.setItem('safenav_notifs', JSON.stringify(stored.slice(0, 50)));
  } catch {}
}

export function getNotificationHistory() {
  if (_notifHistory.length > 0) return _notifHistory;
  try {
    return JSON.parse(localStorage.getItem('safenav_notifs') || '[]');
  } catch { return []; }
}

export function clearNotificationHistory() {
  _notifHistory = [];
  localStorage.removeItem('safenav_notifs');
}

// ── Main dispatcher ───────────────────────────────────────────
export function dispatchNotification({
  type,
  title,
  message,
  distance,         // meters
  location,         // { lat, lng }
  locationKey,      // string key for cooldown dedup
  actions = [],
  data = {},
  force = false,    // bypass cooldown (e.g. SOS)
}) {
  const meta = NOTIF_TYPES[type];
  if (!meta) return null;

  const priority = meta.priority;

  // Quiet hours check
  if (!force && isQuietHour(priority)) return null;

  // Cooldown check
  if (!force && isOnCooldown(type, locationKey)) return null;

  setCooldown(type, locationKey);

  const notif = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    priority,
    icon: meta.icon,
    color: meta.color,
    title,
    message,
    distance: distance ? `${(distance / 1000).toFixed(1)} km` : null,
    location,
    actions,
    data,
    timestamp: Date.now(),
    read: false,
  };

  broadcastNotification(notif);

  // Web Notifications API for critical/high
  if (priority >= PRIORITY.HIGH && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body: message, icon: '/favicon.ico', tag: type, renotify: true });
    } catch {}
  }

  // Vibration
  if (priority === PRIORITY.CRITICAL && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
  else if (priority === PRIORITY.HIGH && navigator.vibrate) navigator.vibrate([150, 80, 150]);

  // Voice alert for critical
  if (priority === PRIORITY.CRITICAL && 'speechSynthesis' in window) {
    const utt = new SpeechSynthesisUtterance(message);
    utt.lang = 'en-IN'; utt.rate = 0.95; utt.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }

  return notif;
}

// ── Safety zone evaluator ─────────────────────────────────────
export function evaluateSafetyZone({ userLocation, areaScore, isNight, userActivity }) {
  if (!userLocation) return;

  // Entering high-risk area at night
  if (areaScore < 40 && isNight) {
    dispatchNotification({
      type: 'DANGER_ZONE',
      title: '⚠️ High-Risk Area Detected',
      message: 'You are entering a high-risk zone. Stay alert and share your location.',
      locationKey: `zone_${userLocation.lat.toFixed(3)}_${userLocation.lng.toFixed(3)}`,
      actions: [
        { label: 'Share Location', action: 'share_location' },
        { label: 'Call Emergency', action: 'call_emergency' },
      ],
    });
  } else if (areaScore < 55 && isNight) {
    dispatchNotification({
      type: 'SAFETY_SCORE_LOW',
      title: 'Area Safety Alert',
      message: 'This area has reduced safety score at night. Be cautious.',
      locationKey: `medium_${userLocation.lat.toFixed(3)}_${userLocation.lng.toFixed(3)}`,
    });
  }
}

// ── Community report dispatcher ───────────────────────────────
export function notifyFromReport({ report, userLocation, userActivity }) {
  if (!report || !userLocation) return;

  const dist = haversine(userLocation.lat, userLocation.lng, report.lat, report.lng);
  if (dist > 2000) return; // > 2km, skip

  const typeMap = {
    harassment:    { notifType: 'CRIME_NEARBY', title: 'Harassment Reported Nearby' },
    unsafe_street: { notifType: 'UNSAFE_ROUTE', title: 'Unsafe Street Reported' },
    suspicious:    { notifType: 'CRIME_NEARBY', title: 'Suspicious Activity Nearby' },
    poor_lighting: { notifType: 'POOR_LIGHTING', title: 'Poor Lighting Area Ahead' },
  };

  const mapping = typeMap[report.type] || { notifType: 'CRIME_NEARBY', title: 'Incident Reported Nearby' };

  dispatchNotification({
    type: mapping.notifType,
    title: mapping.title,
    message: report.description || `Community report within ${Math.round(dist)}m of your location.`,
    distance: dist,
    location: { lat: report.lat, lng: report.lng },
    locationKey: `report_${report.id}`,
    actions: [{ label: 'View on Map', action: 'view_map' }],
  });
}

// ── Request notification permission ──────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}