import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Navigation, X, Clock, Route, Loader2, Layers, Target
} from 'lucide-react';
import SafetyBadge from '@/components/common/SafetyBadge';
import { INDIAN_LOCATIONS } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { scoreRoute, getRouteHighlights } from '@/lib/riskEngine';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { MapFlyTo, MapFitBounds } from '@/components/navigate/MapController';
import UserLocationMarker from '@/components/navigate/UserLocationMarker';
import RoutePolylines from '@/components/navigate/RoutePolylines';
import SafetyHeatmap from '@/components/navigate/SafetyHeatmap';
import NavigationMode from '@/components/navigate/NavigationMode';

if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

const ROUTE_STYLES = {
  safest:   { color: '#22C55E', label: 'Safest Route',   icon: '🛡️' },
  balanced: { color: '#F59E0B', label: 'Balanced Route', icon: '⚖️' },
  fastest:  { color: '#f42424', label: 'Fastest Route',  icon: '⚡' },
};

async function fetchOSRMRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes && data.routes[0]) {
    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const dist = (data.routes[0].distance / 1000).toFixed(1);
    const dur = Math.round(data.routes[0].duration / 60);
    return { coords, dist, dur };
  }
  return null;
}

async function geocodeSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  return res.json();
}

// Smart zoom based on place type
function getZoomForPlace(place) {
  const type = place.type || '';
  const cls = place.class || '';
  if (cls === 'boundary' || type === 'administrative') {
    const rank = parseInt(place.place_rank || 10);
    if (rank <= 8) return 6;   // country/state
    if (rank <= 12) return 10; // district
    return 13;                 // city
  }
  if (type === 'city' || type === 'town') return 12;
  if (type === 'suburb' || type === 'neighbourhood') return 14;
  return 16; // specific place / landmark
}

export default function Navigate() {
  const { t } = useLanguage();
  const { userLocation } = useAppContext();

  // Search
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const debounceRef = useRef(null);

  // Destination & exploration
  const [destination, setDestination] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);   // { lat, lng, zoom } or null
  const [mapBbox, setMapBbox] = useState(null);       // for fitBounds

  // Route state
  const [routes, setRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('safest');
  const [routeLoading, setRouteLoading] = useState(false);
  const [reports, setReports] = useState([]);

  // Map overlays
  const [heatmapVisible, setHeatmapVisible] = useState(false);

  // Navigation mode
  const [navigating, setNavigating] = useState(false);
  const [navRouteType, setNavRouteType] = useState('safest');

  // Auto-fetch reports
  useEffect(() => {
    base44.entities.IncidentReport.list('-created_date', 80)
      .then(setReports).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try { setSuggestions((await geocodeSearch(query)).slice(0, 8)); }
      catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 380);
  }, [query]);

  const handleSelectPlace = useCallback((place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon || place.lng);
    const name = place.display_name
      ? place.display_name.split(',').slice(0, 2).join(', ')
      : place.name;

    const dest = { lat, lng, name, raw: place };
    setDestination(dest);
    setQuery(name);
    setSuggestions([]);
    setShowSearch(false);
    setRoutes(null);

    // Smart fly: use bounding box when available
    // Nominatim boundingbox = [minlat, maxlat, minlng, maxlng]
    const bb = place.boundingbox;
    if (bb && Math.abs(parseFloat(bb[1]) - parseFloat(bb[0])) > 0.02) {
      // pass as [minLat, maxLat, minLng, maxLng]
      setMapBbox([parseFloat(bb[0]), parseFloat(bb[1]), parseFloat(bb[2]), parseFloat(bb[3])]);
      setMapTarget(null);
    } else {
      const zoom = getZoomForPlace(place);
      setMapTarget({ lat, lng, zoom });
      setMapBbox(null);
    }
  }, []);

  const handleFindRoutes = async () => {
    if (!destination) return;
    setRouteLoading(true);
    setRoutes(null);
    try {
      const from = userLocation;
      const to = destination;

      // Fetch 3 OSRM routes (main + slight variants for alt routes)
      const [r1, r2, r3] = await Promise.allSettled([
        fetchOSRMRoute(from, to),
        fetchOSRMRoute(from, { lat: to.lat + 0.004, lng: to.lng + 0.003 }),
        fetchOSRMRoute(from, { lat: to.lat - 0.003, lng: to.lng - 0.004 }),
      ]);

      const base = r1.status === 'fulfilled' ? r1.value : null;
      if (!base) { setRouteLoading(false); return; }

      const alt1 = (r2.status === 'fulfilled' && r2.value) ? r2.value : base;
      const alt2 = (r3.status === 'fulfilled' && r3.value) ? r3.value : base;

      const s1 = scoreRoute(base.coords, reports);
      const s2 = scoreRoute(alt1.coords, reports);
      const s3 = scoreRoute(alt2.coords, reports);

      const builtRoutes = {
        safest:   { ...base, dur: Math.round(base.dur * 1.15), score: Math.max(s1, s2, s3), highlights: getRouteHighlights(s1, 'safest') },
        balanced: { ...alt1, score: s2, highlights: getRouteHighlights(s2, 'balanced') },
        fastest:  { ...alt2, dur: Math.round(alt2.dur * 0.85), score: Math.min(s3, s2 - 4), highlights: getRouteHighlights(s3, 'fastest') },
      };

      setRoutes(builtRoutes);
      setSelectedRoute('safest');

      // Fit map to show full route
      const allCoords = Object.values(builtRoutes).flatMap(r => r.coords);
      setMapBbox(null); setMapTarget(null);
    } catch (e) { console.error(e); }
    finally { setRouteLoading(false); }
  };

  const handleStartNav = (routeType) => {
    setNavRouteType(routeType);
    setNavigating(true);
  };

  const handleEndNav = () => setNavigating(false);

  const handleReroute = async (newType) => {
    setNavigating(false);
    await handleFindRoutes();
    setTimeout(() => {
      setSelectedRoute(newType);
      setNavRouteType(newType);
      setNavigating(true);
    }, 1000);
  };

  const handleRecenter = () => {
    setMapTarget({ lat: userLocation.lat, lng: userLocation.lng, zoom: 15 });
    setMapBbox(null);
  };

  const destIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative">
      <div style="width:22px;height:22px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 0 14px rgba(239,68,68,0.7)"></div>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  });

  // Navigation active — full screen
  if (navigating && routes) {
    return (
      <NavigationMode
        route={routes[navRouteType]}
        destination={destination}
        routeType={navRouteType}
        reports={reports}
        onEnd={handleEndNav}
        onReroute={handleReroute}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]" style={{ background: '#0B0F1A' }}>

      {/* ── Search Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-3 pt-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl cursor-text"
          style={{
            background: 'rgba(11,15,26,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
          onClick={() => setShowSearch(true)}
        >
          <div className="w-7 h-7 rounded-xl btn-gradient flex items-center justify-center shrink-0">
            <Search className="w-3.5 h-3.5 text-white" />
          </div>
          <span className={cn('text-sm flex-1 truncate', destination ? 'text-white' : 'text-gray-500')}>
            {destination ? destination.name : 'Search city, area, landmark…'}
          </span>
          {destination && (
            <button onClick={e => { e.stopPropagation(); setDestination(null); setRoutes(null); setQuery(''); }}
              className="p-1">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Floating controls row */}
        <div className="flex gap-2 mt-2">
          {destination && !routes && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFindRoutes}
              disabled={routeLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #6366F1)', boxShadow: '0 2px 12px rgba(79,70,229,0.4)' }}>
              {routeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
              {routeLoading ? 'Analysing…' : 'Find Routes'}
            </motion.button>
          )}
          <button onClick={() => setHeatmapVisible(h => !h)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={heatmapVisible
              ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444' }
              : { background: 'rgba(11,15,26,0.85)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', backdropFilter: 'blur(12px)' }}>
            <Layers className="w-3.5 h-3.5" />
            {heatmapVisible ? 'Heat ON' : 'Heatmap'}
          </button>
          <button onClick={handleRecenter}
            className="w-9 h-9 rounded-xl flex items-center justify-center ml-auto transition-all"
            style={{ background: 'rgba(11,15,26,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <Target className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Full-screen Map ── */}
      <div className="absolute inset-0">
          {userLocation && (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Map camera control */}
          {mapTarget && <MapFlyTo target={mapTarget} />}
          {mapBbox && <MapFlyTo bbox={mapBbox} />}
          {routes && (
            <MapFitBounds positions={Object.values(routes).flatMap(r => r.coords)} />
          )}

          {/* User location */}
          <UserLocationMarker position={userLocation} />

          {/* Destination marker */}
          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
              <Popup>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{destination.name}</div>
              </Popup>
            </Marker>
          )}

          {/* Route lines */}
          <RoutePolylines
            routes={routes}
            selectedRoute={selectedRoute}
            reports={reports}
            onSelectRoute={setSelectedRoute}
          />

          {/* Safety heatmap overlay */}
          <SafetyHeatmap reports={reports} visible={heatmapVisible} />
        </MapContainer>
        )}
      </div>

      {/* ── Loading overlay ── */}
      <AnimatePresence>
        {routeLoading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[800] flex items-center justify-center"
            style={{ background: 'rgba(11,15,26,0.6)', backdropFilter: 'blur(6px)' }}>
            <div className="rounded-3xl p-6 flex flex-col items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4F46E5' }} />
              <p className="text-sm font-semibold text-white">Generating road-based routes…</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>AI safety analysis in progress</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Route Cards Panel ── */}
      <AnimatePresence>
        {routes && !routeLoading && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute bottom-0 left-0 right-0 z-[700] px-3 pt-3 pb-4"
            style={{
              background: 'rgba(11,15,26,0.97)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px 24px 0 0',
            }}>
            {/* Drag handle */}
            <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-3" />

            {/* Route cards */}
            <div className="space-y-2 mb-3">
              {Object.entries(routes).map(([key, route]) => {
                const style = ROUTE_STYLES[key];
                const isSelected = selectedRoute === key;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRoute(key)}
                    className="w-full rounded-2xl p-3 text-left transition-all"
                    style={{
                      background: isSelected ? `${style.color}14` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isSelected ? style.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: style.color, boxShadow: `0 0 8px ${style.color}` }} />
                        <span className="text-sm font-semibold text-white">{style.icon} {style.label}</span>
                      </div>
                      <SafetyBadge score={route.score} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 ml-5">
                      <span className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                        <Clock className="w-3 h-3" /> {route.dur} min
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                        <Route className="w-3 h-3" /> {route.dist} km
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#6B7280' }}>
                        Road-based ✓
                      </span>
                    </div>
                    {isSelected && route.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 ml-5">
                        {route.highlights.map((h, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }}>{h}</span>
                        ))}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Start navigation */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleStartNav(selectedRoute)}
              className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${ROUTE_STYLES[selectedRoute].color}, ${ROUTE_STYLES[selectedRoute].color}bb)`,
                boxShadow: `0 4px 20px ${ROUTE_STYLES[selectedRoute].color}40`,
              }}>
              <Navigation className="w-4 h-4" /> Start Navigation
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex flex-col"
            style={{ background: '#0B0F1A' }}>
            {/* Search header */}
            <div className="px-4 pt-12 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSearch(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search city, colony, landmark, address…"
                    className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-gray-600"
                  />
                  {searchLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: '#4F46E5' }} />}
                  {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-gray-500" /></button>}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Live suggestions */}
              {suggestions.length > 0 && (
                <div>
                  {suggestions.map((place, i) => {
                    const mainName = place.display_name.split(',').slice(0, 2).join(', ');
                    const subName = place.display_name.split(',').slice(2, 4).join(', ');
                    return (
                      <button key={i} onClick={() => handleSelectPlace(place)}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: 'rgba(79,70,229,0.15)', color: '#818CF8' }}>
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{mainName}</p>
                          {subName && <p className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>{subName}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Popular places (shown when query empty) */}
              {query.length < 2 && (
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>
                    Popular Destinations
                  </p>
                  {INDIAN_LOCATIONS.slice(0, 12).map(loc => (
                    <button key={loc.id}
                      onClick={() => handleSelectPlace({ lat: loc.lat, lon: loc.lng, lng: loc.lng, display_name: `${loc.name}, ${loc.city}`, name: `${loc.name}, ${loc.city}`, type: 'attraction' })}
                      className="w-full flex items-center gap-3 py-3 px-2 rounded-2xl text-left transition-all hover:bg-white/5"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
                        <MapPin className="w-4 h-4" style={{ color: '#818CF8' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{loc.name}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{loc.city}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {query.length >= 2 && !searchLoading && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                  <div className="w-14 h-14 rounded-3xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Search className="w-6 h-6" style={{ color: '#6B7280' }} />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">No results found</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Try searching a city, area, or landmark</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}