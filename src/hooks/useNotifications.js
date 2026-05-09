/**
 * useNotifications — React hook for the Global Notification System
 * Wires the notification engine to React state + auto-fires context-aware alerts
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToNotifications,
  dispatchNotification,
  getNotificationHistory,
  clearNotificationHistory,
  evaluateSafetyZone,
  notifyFromReport,
  requestNotificationPermission,
  PRIORITY,
} from '@/lib/notificationEngine';

const ZONE_CHECK_INTERVAL = 45000; // 45 seconds

export function useNotifications({ userLocation, areaScore, isNight, reports = [], userActivity = 'idle', enabled = true } = {}) {
  const [notifications, setNotifications] = useState(() => getNotificationHistory());
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeAlert, setActiveAlert] = useState(null); // critical overlay alert
  const prevReportIdsRef = useRef(new Set());
  const zoneCheckRef = useRef(null);

  // Subscribe to new notifications
  useEffect(() => {
    const unsub = subscribeToNotifications((notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 100));
      setUnreadCount(n => n + 1);

      // Show critical overlay
      if (notif.priority === PRIORITY.CRITICAL) {
        setActiveAlert(notif);
      }
    });
    return unsub;
  }, []);

  // Auto-request permission
  useEffect(() => {
    if (enabled) requestNotificationPermission();
  }, [enabled]);

  // Zone safety check
  useEffect(() => {
    if (!enabled || !userLocation) return;
    const check = () => evaluateSafetyZone({ userLocation, areaScore, isNight, userActivity });
    check();
    zoneCheckRef.current = setInterval(check, ZONE_CHECK_INTERVAL);
    return () => clearInterval(zoneCheckRef.current);
  }, [userLocation?.lat, userLocation?.lng, areaScore, isNight, enabled]);

  // Watch for new community reports
  useEffect(() => {
    if (!enabled || !userLocation || !reports.length) return;
    reports.forEach(r => {
      if (!prevReportIdsRef.current.has(r.id)) {
        prevReportIdsRef.current.add(r.id);
        // Only fire for newly-seen reports (not on initial load bulk)
        if (prevReportIdsRef.current.size > 1) {
          notifyFromReport({ report: r, userLocation, userActivity });
        }
      }
    });
  }, [reports, userLocation, userActivity, enabled]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    clearNotificationHistory();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const send = useCallback((params) => dispatchNotification(params), []);

  return {
    notifications,
    unreadCount,
    activeAlert,
    dismissActiveAlert: () => setActiveAlert(null),
    markAllRead,
    markRead,
    dismiss,
    clearAll,
    send,
  };
}