import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MessageCircle, MapPin, CheckCircle2, Share2,
  Camera, Mic, X, AlertTriangle, Clock, Radio, Loader2, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEvidenceCapture } from '@/hooks/useEvidenceCapture';
import { getAnonymousId } from '@/lib/chatUtils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapCenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    return [addr.road, addr.suburb, addr.city || addr.town || addr.village]
      .filter(Boolean).slice(0, 2).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

const COUNTDOWN_SECS = 3;

export default function SOS() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { contacts, userLocation, sosCapture, setSosActive, isOnline, startRepeatingAlerts, stopRepeatingAlerts } = useAppContext();
  const { startCapture, stopCapture, isCapturing, uploadPending } = useEvidenceCapture();

  const [phase, setPhase] = useState('countdown');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [cancelled, setCancelled] = useState(false);
  const [sosEventId, setSosEventId] = useState(null);
  const [address, setAddress] = useState('Locating...');
  const [statuses, setStatuses] = useState({
    sms: 'pending', whatsapp: 'pending', tracking: 'pending', recording: 'pending',
  });
  const [seenBy, setSeenBy] = useState({}); // contactId -> true
  const anonId = getAnonymousId();

  const locationUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
  const whatsappMsg = encodeURIComponent(
    `🚨 EMERGENCY SOS!\nI need immediate help!\n📍 Location: ${locationUrl}\n⏰ ${new Date().toLocaleTimeString()}\n— SafeNav360X`
  );

  useEffect(() => {
    reverseGeocode(userLocation.lat, userLocation.lng).then(setAddress);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) { triggerAllSOS(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  const triggerAllSOS = async () => {
    if (cancelled) return;
    setPhase('sending');
    setSosActive(true);

    if (sosCapture !== 'off') {
      startCapture(sosCapture);
      setStatuses(s => ({ ...s, recording: 'sent' }));
    }
    setStatuses(s => ({ ...s, tracking: 'sent' }));

    base44.entities.SOSEvent.create({
      lat: userLocation.lat, lng: userLocation.lng,
      status: 'active', contacts_notified: contacts.map(c => c.phone),
      user_id: anonId,
    }).then(ev => setSosEventId(ev.id)).catch(() => {});

    // Unique recipients (dedup)
    const uniqueContacts = contacts.filter((c, i, arr) =>
      arr.findIndex(x => x.phone === c.phone) === i
    );

    uniqueContacts.forEach(c => {
      base44.entities.ChatMessage.create({
        sender_id: anonId,
        sender_name: anonId,
        recipient_id: String(c.id),
        contact_phone: c.phone,
        content: `🚨 EMERGENCY!\nI am in danger, please help!\n📍 Location: ${locationUrl}\n🆔 ID: ${anonId}\n⏰ ${new Date().toLocaleTimeString()}`,
        is_emergency: true,
        messageType: 'alert',
        lat: userLocation.lat,
        lng: userLocation.lng,
        location_shared: true,
        status: 'sent',
      }).catch(() => {});
    });

    // Start repeating alerts every 60s
    startRepeatingAlerts(anonId, locationUrl, whatsappMsg);

    try {
      const smsBody = `🚨 EMERGENCY SOS! I need help. My location: ${locationUrl}`;
      const phones = contacts.map(c => c.phone.replace(/\D/g, '')).filter(Boolean);
      if (phones.length > 0) window.location.href = `sms:${phones.join(',')}?body=${encodeURIComponent(smsBody)}`;
      setStatuses(s => ({ ...s, sms: 'sent' }));
    } catch { setStatuses(s => ({ ...s, sms: 'failed' })); }

    setTimeout(() => {
      if (contacts[0]) {
        const ph = contacts[0].phone.replace(/\D/g, '');
        if (ph) window.open(`https://wa.me/${ph}?text=${whatsappMsg}`, '_blank');
      }
      setStatuses(s => ({ ...s, whatsapp: 'sent' }));
    }, 800);

    setTimeout(() => setPhase('sent'), 1800);
  };

  const handleCancel = () => {
    setCancelled(true);
    setSosActive(false);
    navigate('/');
  };

  const handleResolve = async () => {
    stopCapture();
    stopRepeatingAlerts();
    if (sosEventId) {
      await base44.entities.SOSEvent.update(sosEventId, {
        status: 'resolved', resolved_at: new Date().toISOString(),
      });
    }
    setSosActive(false);
    navigate('/');
  };

  const userIcon = L.divIcon({
    html: `<div style="width:18px;height:18px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,0.8)"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });

  // --- COUNTDOWN SCREEN ---
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, #1a0505 0%, #0B0F1A 100%)' }}>
        {/* Pulse rings */}
        <div className="relative mb-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border border-red-500/30"
              style={{ animation: `sos-pulse ${1.2 + i * 0.3}s ease-out ${i * 0.2}s infinite`, margin: `-${i * 20}px` }} />
          ))}
          <motion.div
            key={countdown}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-36 h-36 rounded-full flex items-center justify-center relative"
            style={{
              background: 'radial-gradient(circle, rgba(239,68,68,0.3), rgba(239,68,68,0.05))',
              border: '3px solid rgba(239,68,68,0.5)',
              boxShadow: '0 0 40px rgba(239,68,68,0.4), inset 0 0 40px rgba(239,68,68,0.1)',
            }}>
            <span className="text-7xl font-black text-white">{countdown}</span>
          </motion.div>
        </div>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2 tracking-tight">SOS Activating…</motion.p>
        <p className="text-sm mb-10 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
          All contacts will be alerted automatically
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCancel}
          className="px-10 h-13 rounded-2xl font-bold text-danger flex items-center gap-2 py-3"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.4)',
          }}>
          <X className="w-4 h-4" /> Cancel SOS
        </motion.button>
      </div>
    );
  }

  // --- SENDING SCREEN ---
  if (phase === 'sending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: 'linear-gradient(180deg, #1a0505 0%, #0B0F1A 100%)' }}>
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(239,68,68,0.2)', margin: '-16px' }} />
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '2px solid rgba(239,68,68,0.4)',
              boxShadow: '0 0 40px rgba(239,68,68,0.4)',
            }}>
            <span className="text-white font-black text-xl">SOS</span>
          </motion.div>
        </div>
        <p className="text-white font-bold text-xl mb-3">Alerting contacts…</p>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(239,68,68,0.7)' }} />
      </div>
    );
  }

  // --- SENT SCREEN ---
  return (
    <div className="min-h-screen flex flex-col overflow-y-auto" style={{ background: '#0B0F1A' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(180deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.15)',
        }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '2px solid rgba(16,185,129,0.4)',
            boxShadow: '0 0 24px rgba(16,185,129,0.3)',
          }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: '#10B981' }} />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Alert Sent</h2>
        <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <MapPin className="w-3 h-3" /> {address}
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Status card */}
        <div className="rounded-3xl p-4 space-y-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}>
          <p className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>TRANSMISSION STATUS</p>
          <StatusRow icon={<MessageCircle className="w-4 h-4" />} label="SMS Sent to Contacts" status={statuses.sms} />
          <StatusRow icon={<MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />} label="WhatsApp Alert Opened" status={statuses.whatsapp} />
          <StatusRow icon={<Radio className="w-4 h-4" />} label="Live Tracking Active" status={statuses.tracking} />
          {sosCapture !== 'off' && (
            <StatusRow
              icon={sosCapture === 'audio' ? <Mic className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              label={`${sosCapture === 'audio' ? 'Audio' : sosCapture === 'camera' ? 'Video' : 'A/V'} Recording Active`}
              status={statuses.recording}
            />
          )}
          {uploadPending > 0 && !isOnline && (
            <div className="flex items-center gap-1.5 text-[10px] rounded-lg px-2 py-1.5"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
              <Clock className="w-3 h-3" /> {uploadPending} file(s) will sync when online
            </div>
          )}
        </div>

        {/* Mini map */}
        <div className="rounded-3xl overflow-hidden" style={{ height: 150, border: '1px solid rgba(239,68,68,0.2)' }}>
          <MapContainer
            center={[userLocation.lat, userLocation.lng]} zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapCenter lat={userLocation.lat} lng={userLocation.lng} />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
          </MapContainer>
        </div>

        {/* Call 112 */}
        <a href="tel:112" className="block">
          <motion.button whileTap={{ scale: 0.97 }} className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 text-white"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              boxShadow: '0 4px 24px rgba(239,68,68,0.4)',
            }}>
            <Phone className="w-5 h-5" /> Call 112 Emergency
          </motion.button>
        </a>

        {/* Share location */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'SOS Location', text: `Emergency! My location: ${locationUrl}`, url: locationUrl });
            } else {
              navigator.clipboard.writeText(locationUrl);
            }
          }}
          className="w-full h-11 rounded-2xl text-sm flex items-center justify-center gap-2 font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#E5E7EB',
          }}>
          <Share2 className="w-4 h-4" /> Share Location Link
        </button>

        {/* Contacts notified */}
        <div className="rounded-3xl p-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#9CA3AF' }}>📲 CONTACTS NOTIFIED</p>
          <div className="space-y-3">
            {contacts.length === 0 && (
              <p className="text-xs" style={{ color: '#9CA3AF' }}>No trusted contacts added. Go to Settings.</p>
            )}
            {contacts.map(contact => (
              <div key={contact.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold"
                    style={{ background: 'rgba(79,70,229,0.15)', color: '#818CF8', border: '1px solid rgba(79,70,229,0.3)' }}>
                    {contact.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{contact.name}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{contact.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {seenBy[contact.id]
                    ? <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: '#10B981' }}>
                        <CheckCircle2 className="w-3 h-3" /> Seen
                      </span>
                    : <span className="text-[10px] font-semibold" style={{ color: '#F59E0B' }}>⏳ Pending</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* I'm safe */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleResolve}
          className="w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '2px solid rgba(16,185,129,0.35)',
            color: '#10B981',
            boxShadow: '0 0 16px rgba(16,185,129,0.15)',
          }}>
          <CheckCircle2 className="w-4 h-4" /> I'm Safe — Cancel SOS
        </motion.button>
      </div>
    </div>
  );
}

function StatusRow({ icon, label, status }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5 text-sm" style={{ color: '#E5E7EB' }}>
        <span style={{ color: '#9CA3AF' }}>{icon}</span>
        <span>{label}</span>
      </div>
      {status === 'sent' && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#10B981' }} />}
      {status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-t-indigo-400 border-white/10 animate-spin shrink-0" />}
      {status === 'failed' && <X className="w-4 h-4 shrink-0 text-danger" />}
    </div>
  );
}