import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { computeAreaSafetyScore } from '@/lib/riskEngine';

// Renders safety heatmap overlay on the map
export default function SafetyHeatmap({ reports = [], visible }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    if (layerRef.current) map.removeLayer(layerRef.current);

    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const gridSize = 0.008; // ~800m grid
    const circles = [];

    for (let lat = sw.lat; lat <= ne.lat; lat += gridSize) {
      for (let lng = sw.lng; lng <= ne.lng; lng += gridSize) {
        const score = computeAreaSafetyScore(lat, lng, reports, 600);
        if (score >= 80) continue; // Skip safe areas (no clutter)

        const color = score < 40 ? '#EF4444' : score < 65 ? '#F59E0B' : '#EAB308';
        const opacity = score < 40 ? 0.35 : score < 65 ? 0.22 : 0.15;

        const circle = L.circle([lat, lng], {
          radius: 450,
          color: 'transparent',
          fillColor: color,
          fillOpacity: opacity,
        });
        circles.push(circle);
      }
    }

    layerRef.current = L.layerGroup(circles);
    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [visible, reports, map]);

  // Re-render on map move
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      // Trigger re-render by removing + recreating
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
    map.on('moveend', handler);
    return () => map.off('moveend', handler);
  }, [visible, map]);

  return null;
}