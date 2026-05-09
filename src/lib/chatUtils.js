// Anonymous ID generation & chat utilities

export function getAnonymousId() {
  let id = localStorage.getItem('safenav_anon_id');
  if (!id) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    id = 'SNX-' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    localStorage.setItem('safenav_anon_id', id);
  }
  return id;
}

export function getNickname() {
  return localStorage.getItem('safenav_nickname') || null;
}

export function setNickname(name) {
  localStorage.setItem('safenav_nickname', name);
}

export function getDisplayName() {
  return getNickname() || getAnonymousId();
}

export function timeLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function buildSOSMessage(location, anonId) {
  const mapLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return {
    content: `🚨 EMERGENCY!\nI need help immediately.\n📍 Live Location: ${mapLink}\n🆔 ID: ${anonId}`,
    messageType: 'alert',
    is_emergency: true,
    location_shared: true,
    lat: location.lat,
    lng: location.lng,
  };
}

export function buildLocationMessage(location, anonId) {
  const mapLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return {
    content: `📍 Location shared\n${mapLink}\nUpdated: ${new Date().toLocaleTimeString()}`,
    messageType: 'location',
    location_shared: true,
    lat: location.lat,
    lng: location.lng,
    mapLink,
  };
}

// Offline message queue helpers
export function queueOfflineMessage(msgData) {
  const queue = JSON.parse(localStorage.getItem('safenav_chat_queue') || '[]');
  queue.push({ ...msgData, _queued_at: Date.now() });
  localStorage.setItem('safenav_chat_queue', JSON.stringify(queue));
}

export function getOfflineQueue() {
  return JSON.parse(localStorage.getItem('safenav_chat_queue') || '[]');
}

export function clearOfflineQueue() {
  localStorage.setItem('safenav_chat_queue', '[]');
}