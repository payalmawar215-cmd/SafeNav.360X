import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Flies map to a bounding box or coordinate with smart zoom
export function MapFlyTo({ target, bbox }) {
  const map = useMap();
  const prevTargetRef = useRef(null);
  const prevBboxRef = useRef(null);

  useEffect(() => {
    const targetChanged = target && JSON.stringify(target) !== JSON.stringify(prevTargetRef.current);
    const bboxChanged = bbox && JSON.stringify(bbox) !== JSON.stringify(prevBboxRef.current);

    if (!targetChanged && !bboxChanged) return;

    if (bbox && bboxChanged && bbox.length === 4) {
      // bbox = [minLat, maxLat, minLng, maxLng] from Nominatim
      const bounds = L.latLngBounds([[bbox[0], bbox[2]], [bbox[1], bbox[3]]]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true });
      prevBboxRef.current = bbox;
    } else if (target && targetChanged) {
      map.flyTo([target.lat, target.lng], target.zoom || 15, { animate: true, duration: 0.8 });
      prevTargetRef.current = target;
    }
  }, [target, bbox, map]);
  return null;
}

// Fits bounds around a set of positions
export function MapFitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [positions, map]);
  return null;
}

// Smoothly follows user location
export function MapFollowUser({ position, follow }) {
  const map = useMap();
  const prevPos = useRef(null);
  useEffect(() => {
    if (!follow || !position) return;
    if (prevPos.current) {
      map.panTo([position.lat, position.lng], { animate: true, duration: 0.5 });
    } else {
      map.setView([position.lat, position.lng], 16);
    }
    prevPos.current = position;
  }, [position, follow, map]);
  return null;
}