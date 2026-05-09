import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DEFAULT_CONTACTS } from './mockData';
import { base44 } from '@/api/base44Client';
import { getAnonymousId, buildSOSMessage } from './chatUtils';
import { detectMotionState } from './locationEngine';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [networkType, setNetworkType] = useState('4G');
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('safenav_contacts');
    return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
  });
  const [alertSensitivity, setAlertSensitivity] = useState('medium');
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [isDark, setIsDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sosCapture, setSosCapture] = useState('both');
  const [sosActive, setSosActive] = useState(false);
  const [voiceActivation, setVoiceActivation] = useState(() =>
    localStorage.getItem('safenav_voice') === 'true'
  );
  const [stealthMode, setStealthMode] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() =>
    JSON.parse(localStorage.getItem('safenav_offline_queue') || '[]')
  );
  // Shake SOS
  const [shakeSOSEnabled, setShakeSOSEnabled] = useState(() =>
    localStorage.getItem('safenav_shake_sos') === 'true'
  );
  // Voice settings
  const [voiceCodeword, setVoiceCodeword] = useState(() =>
    localStorage.getItem('safenav_voice_codeword') || ''
  );
  const [voiceMode, setVoiceMode] = useState(() =>
    localStorage.getItem('safenav_voice_mode') || 'safe'
  );

  const locationWatchRef = useRef(null);
  const locationBroadcastRef = useRef(null);
  const repeatingAlertRef = useRef(null);

  // Auto dark mode via prefers-color-scheme
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply dark class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real GPS location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      locationWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {}, // silently fall back to default
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
    return () => {
      if (locationWatchRef.current) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  // Flush offline queue when back online
  useEffect(() => {
    const flush = async () => {
      const queue = JSON.parse(localStorage.getItem('safenav_offline_queue') || '[]');
      if (!queue.length) return;
      const remaining = [];
      for (const item of queue) {
        try {
          if (item.entity === 'SOSEvent') await base44.entities.SOSEvent.create(item.data);
          else if (item.entity === 'ChatMessage') await base44.entities.ChatMessage.create(item.data);
        } catch { remaining.push(item); }
      }
      localStorage.setItem('safenav_offline_queue', JSON.stringify(remaining));
      setOfflineQueue(remaining);
    };
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  // Persist contacts
  useEffect(() => {
    localStorage.setItem('safenav_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Optimistic addContact
  const addContact = (contact) => {
    const newContact = { ...contact, id: Date.now() };
    setContacts(prev => {
      const updated = [...prev, newContact];
      localStorage.setItem('safenav_contacts', JSON.stringify(updated));
      return updated;
    });
  };

  // Optimistic removeContact
  const removeContact = (id) => {
    setContacts(prev => {
      const backup = [...prev];
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('safenav_contacts', JSON.stringify(updated));
      // Rollback after 100ms if needed (simulate optimistic update)
      return updated;
    });
  };

  // SOS: share location to all trusted contacts + send chat messages
  const triggerSOS = () => {
    setSosActive(true);
    const anonId = getAnonymousId();
    const sosMsg = buildSOSMessage(userLocation, anonId);
    const locText = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
    const whatsappMsg = encodeURIComponent(
      `🚨 EMERGENCY SOS! I need help! My live location: ${locText}\n🆔 ID: ${anonId}\n- Sent via SafeNav360X`
    );
    // Send SOS message to all contacts in chat
    contacts.forEach((c, i) => {
      base44.entities.ChatMessage.create({
        sender_id: anonId,
        sender_name: anonId,
        recipient_id: String(c.id),
        contact_phone: c.phone,
        ...sosMsg,
        status: 'sent',
      }).catch(() => {});
      if (i === 0) {
        window.open(`https://wa.me/${c.phone.replace(/\D/g, '')}?text=${whatsappMsg}`, '_blank');
      }
    });
  };

  // Stop repeating alerts
  const stopRepeatingAlerts = () => {
    if (repeatingAlertRef.current) {
      clearInterval(repeatingAlertRef.current);
      repeatingAlertRef.current = null;
    }
  };

  // Start repeating alerts every 60s until stopped
  const startRepeatingAlerts = (anonId, locText, whatsappMsg) => {
    stopRepeatingAlerts();
    repeatingAlertRef.current = setInterval(() => {
      const updatedLoc = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
      contacts.forEach(c => {
        base44.entities.ChatMessage.create({
          sender_id: anonId,
          sender_name: anonId,
          recipient_id: String(c.id),
          contact_phone: c.phone,
          content: `🚨 STILL IN DANGER!\n📍 Updated location: ${updatedLoc}\n🆔 ID: ${anonId}\n⏰ ${new Date().toLocaleTimeString()}`,
          is_emergency: true,
          lat: userLocation.lat,
          lng: userLocation.lng,
          location_shared: true,
          status: 'sent',
          messageType: 'alert',
        }).catch(() => {});
      });
    }, 60000); // every 60s
  };

  return (
    <AppContext.Provider value={{
      isOnline, batteryLevel, networkType,
      contacts, addContact, removeContact,
      alertSensitivity, setAlertSensitivity,
      isTracking, setIsTracking,
      userLocation, setUserLocation,
      isDark, setIsDark,
      sosCapture, setSosCapture,
      sosActive, setSosActive,
      triggerSOS,
      startRepeatingAlerts,
      stopRepeatingAlerts,
      voiceActivation, setVoiceActivation: (val) => {
        setVoiceActivation(val);
        localStorage.setItem('safenav_voice', String(val));
      },
      voiceCodeword, setVoiceCodeword: (val) => {
        setVoiceCodeword(val);
        localStorage.setItem('safenav_voice_codeword', val);
      },
      voiceMode, setVoiceMode: (val) => {
        setVoiceMode(val);
        localStorage.setItem('safenav_voice_mode', val);
      },
      shakeSOSEnabled, setShakeSOSEnabled: (val) => {
        setShakeSOSEnabled(val);
        localStorage.setItem('safenav_shake_sos', String(val));
      },
      stealthMode, setStealthMode,
      offlineQueue,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}