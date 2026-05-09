import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useAppContext } from '@/lib/AppContext.jsx';
import { UNSAFE_ZONES, COMMUNITY_REPORTS } from '@/lib/mockData';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (
      center &&
      (center.lat !== prevCenter.current.lat || center.lng !== prevCenter.current.lng)
    ) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

function LocationMarker({ location }) {
  if (!location) return null;

  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="width:20px;height:20px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return <Marker position={[location.lat, location.lng]} icon={userIcon} />;
}

function UnsafeZones({ userLocation }) {
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  // Show zones within ~50km of user location
  const nearbyZones = UNSAFE_ZONES.filter(zone => {
    const dlat = zone.lat - userLocation.lat;
    const dlng = zone.lng - userLocation.lng;
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    const withinRange = dist < 0.5; // ~50km
    const timeOk = !zone.timeRestriction || (zone.timeRestriction === 'night' && isNight);
    return withinRange && timeOk;
  });

  return nearbyZones.map(zone => {
    const color = zone.severity === 'high' ? '#ef4444' : zone.severity === 'medium' ? '#f59e0b' : '#eab308';
    return (
      <Circle
        key={zone.id}
        center={[zone.lat, zone.lng]}
        radius={zone.radius}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 1.5 }}
      >
        <Popup>
          <div className="text-sm font-medium">{zone.label}</div>
          <div className="text-xs text-gray-500">Severity: {zone.severity}</div>
        </Popup>
      </Circle>
    );
  });
}

function ReportMarkers({ userLocation }) {
  const nearbyReports = COMMUNITY_REPORTS.filter(report => {
    const dlat = report.lat - userLocation.lat;
    const dlng = report.lng - userLocation.lng;
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    return dist < 0.5;
  });

  return nearbyReports.map(report => {
    const icon = L.divIcon({
      className: 'report-marker',
      html: `<div style="width:12px;height:12px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    return (
      <Marker key={report.id} position={[report.lat, report.lng]} icon={icon}>
        <Popup>
          <div className="text-sm font-medium">{report.description}</div>
          <div className="text-xs text-gray-500">{report.time} · Trust: {report.trustScore}%</div>
        </Popup>
      </Marker>
    );
  });
}

export default function MapView({ className = "", height = "300px", showZones = true, showReports = true }) {
  const { userLocation } = useAppContext();

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-border ${className}`} style={{ height }}>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapUpdater center={userLocation} />
        <LocationMarker location={userLocation} />
        {showZones && <UnsafeZones userLocation={userLocation} />}
        {showReports && <ReportMarkers userLocation={userLocation} />}
      </MapContainer>
    </div>
  );
}