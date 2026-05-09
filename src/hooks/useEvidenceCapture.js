import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useEvidenceCapture
 * Handles MediaRecorder-based audio/video capture during SOS.
 * Saves chunks locally first, then uploads to cloud when online.
 */
export function useEvidenceCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadPending, setUploadPending] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // On mount, check if there are pending uploads from previous sessions
  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem('safenav_evidence_queue') || '[]');
    setUploadPending(pending.length);
    // Try to upload if online
    if (navigator.onLine && pending.length > 0) {
      uploadQueuedItems();
    }
  }, []);

  // Listen for online event to flush queue
  useEffect(() => {
    const handler = () => uploadQueuedItems();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, []);

  const uploadQueuedItems = async () => {
    const queue = JSON.parse(localStorage.getItem('safenav_evidence_queue') || '[]');
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        // item.dataUrl is base64 blob
        const blob = dataUrlToBlob(item.dataUrl, item.mimeType);
        const file = new File([blob], item.filename, { type: item.mimeType });
        await base44.integrations.Core.UploadFile({ file });
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem('safenav_evidence_queue', JSON.stringify(remaining));
    setUploadPending(remaining.length);
  };

  const startCapture = async (mode = 'both') => {
    chunksRef.current = [];
    try {
      const constraints = {
        audio: true,
        video: mode === 'camera' || mode === 'both'
          ? { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
          : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = mode === 'audio'
        ? (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg')
        : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4');

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('audio') ? 'webm' : 'webm';
        const filename = `sos_evidence_${Date.now()}.${ext}`;
        saveAndUpload(blob, mimeType, filename);
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };

      recorder.start(5000); // collect every 5s
      setIsCapturing(true);
    } catch (err) {
      // Permissions denied or device unavailable — fail silently
      setIsCapturing(false);
    }
  };

  const stopCapture = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setIsCapturing(false);
  };

  const saveAndUpload = async (blob, mimeType, filename) => {
    const file = new File([blob], filename, { type: mimeType });
    if (navigator.onLine) {
      try {
        await base44.integrations.Core.UploadFile({ file });
        return;
      } catch { /* fall through to local queue */ }
    }
    // Queue locally as data URL
    const reader = new FileReader();
    reader.onload = () => {
      const queue = JSON.parse(localStorage.getItem('safenav_evidence_queue') || '[]');
      queue.push({ dataUrl: reader.result, mimeType, filename, timestamp: Date.now() });
      localStorage.setItem('safenav_evidence_queue', JSON.stringify(queue));
      setUploadPending(queue.length);
    };
    reader.readAsDataURL(blob);
  };

  return { startCapture, stopCapture, isCapturing, uploadPending };
}

function dataUrlToBlob(dataUrl, mimeType) {
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mimeType });
}