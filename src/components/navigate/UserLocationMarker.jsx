import { useEffect, useRef, useState } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

// Kalman-filtered smooth location
function kalmanFilter(prev, curr, noise = 0.1) {
  if (!prev) return curr;
  return {
    lat: prev.lat + noise * (curr.lat - prev.lat),
    lng: prev.lng + noise * (curr.lng - prev.lng),
  };
}

export default function UserLocationMarker({ position, heading }) {
  const [smoothPos, setSmoothPos] = useState(position);
  const prevRef = useRef(null);

  useEffect(() => {
    const filtered = kalmanFilter(prevRef.current, position, 0.3);
    setSmoothPos(filtered);
    prevRef.current = filtered;
  }, [position]);

  const headingDeg = heading || 0;

  const userIcon = L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px">
        <!-- Direction cone -->
        <div style="
          position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(${headingDeg}deg);
          width:0;height:0;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-bottom:14px solid rgba(79,70,229,0.5);
          transform-origin:center bottom;
        "></div>
        <!-- Outer pulse ring -->
        <div style="
          position:absolute;inset:-8px;border-radius:50%;
          background:rgba(79,70,229,0.15);
          animation:pulse-ring 2s ease-out infinite;
        "></div>
        <!-- Blue dot -->
        <div style="
          width:20px;height:20px;margin:4px;
          background:#4F46E5;border:3px solid white;border-radius:50%;
          box-shadow:0 0 16px rgba(79,70,229,0.8);
          position:relative;z-index:2;
        ">
          <div style="width:6px;height:6px;background:white;border-radius:50%;margin:4px auto 0;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  if (!smoothPos) return null;

  return (
    <>
      <Circle
        center={[smoothPos.lat, smoothPos.lng]}
        radius={80}
        pathOptions={{ color: '#4F46E5', fillColor: '#4F46E5', fillOpacity: 0.08, weight: 0 }}
      />
      <Marker position={[smoothPos.lat, smoothPos.lng]} icon={userIcon} />
    </>
  );
}