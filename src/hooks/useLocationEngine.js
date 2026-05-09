/**
 * useLocationEngine — React hook wrapping the Hybrid Location Intelligence Engine
 * Manages GPS watch, interval scheduling, motion state, and SOS ultra-mode
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fuseLocation,
  detectMotionState,
  getTrackingInterval,
  buildSOSPayload,
  predictNextLocation,
  haversine,
} from '@/lib/locationEngine';

const BATTERY_POLL_INTERVAL = 30000;
const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

export function useLocationEngine({ isSOS = false, enabled = true } = {}) {
  const [location, setLocation] = useState(null);
  const [motionState, setMotionState] = useState({ state: 'stationary', speed: 0, heading: 0 });
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [source, setSource] = useState('gps');
  const [confidence, setConfidence] = useState(1);
  const [isTracking, setIsTracking] = useState(false);

  const lastLocationRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const intervalRef = useRef(null);
  const batteryRef = useRef(null);
  const isSOSRef = useRef(isSOS);

  // Keep SOS ref in sync
  useEffect(() => { isSOSRef.current = isSOS; }, [isSOS]);

  // Battery monitor
  useEffect(() => {
    const pollBattery = async () => {
      try {
        if (navigator.getBattery) {
          const bat = await navigator.getBattery();
          setBatteryLevel(Math.round(bat.level * 100));
          bat.addEventListener('levelchange', () => setBatteryLevel(Math.round(bat.level * 100)));
        }
      } catch {}
    };
    pollBattery();
    batteryRef.current = setInterval(pollBattery, BATTERY_POLL_INTERVAL);
    return () => clearInterval(batteryRef.current);
  }, []);

  const updateLocation = useCallback((rawGps) => {
    const mot = detectMotionState(rawGps || lastLocationRef.current || DEFAULT_LOCATION);
    setMotionState(mot);

    const fused = fuseLocation({
      gps: rawGps,
      isSOS: isSOSRef.current,
      lastLocation: lastLocationRef.current,
      batteryLevel,
    });

    if (!fused) {
      // Offline prediction
      if (lastLocationRef.current) {
        const predicted = predictNextLocation(lastLocationRef.current, mot, 10);
        if (predicted) {
          setLocation(predicted);
          lastLocationRef.current = predicted;
          setSource('predicted');
          setConfidence(predicted.confidence);
        }
      }
      return;
    }

    setLocation(fused);
    lastLocationRef.current = fused;
    setSource(fused.source);
    setConfidence(fused.confidence);
  }, [batteryLevel]);

  // GPS watcher
  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) return;

    setIsTracking(true);

    // Continuous GPS in SOS mode; otherwise watch + interval
    if (isSOS) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => updateLocation(null),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 3000 }
      );
    } else {
      // Initial fix
      navigator.geolocation.getCurrentPosition(
        (pos) => updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => updateLocation(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );

      // Schedule subsequent updates based on motion
      const scheduleNext = () => {
        const interval = getTrackingInterval(motionState.state, isSOSRef.current, batteryLevel);
        intervalRef.current = setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
              scheduleNext();
            },
            () => { updateLocation(null); scheduleNext(); },
            { enableHighAccuracy: motionState.state !== 'stationary', timeout: 6000 }
          );
        }, interval);
      };
      scheduleNext();
    }

    return () => {
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
      if (intervalRef.current) clearTimeout(intervalRef.current);
      setIsTracking(false);
    };
  }, [enabled, isSOS, updateLocation]);

  const getSOSPayload = useCallback((userId) => {
    if (!lastLocationRef.current) return null;
    return buildSOSPayload(lastLocationRef.current, batteryLevel, userId);
  }, [batteryLevel]);

  const clearHistory = useCallback(() => {
    lastLocationRef.current = null;
    setLocation(null);
  }, []);

  return {
    location: location || { ...DEFAULT_LOCATION, accuracy: 50, source: 'gps', confidence: 0.9 },
    motionState,
    batteryLevel,
    source,
    confidence,
    isTracking,
    getSOSPayload,
    clearHistory,
  };
}