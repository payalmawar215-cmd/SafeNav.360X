import { Polyline } from 'react-leaflet';

// Unique visual identity per route type
export const ROUTE_STYLES = {
  safest: {
    color: '#22C55E',
    activeWeight: 7,
    inactiveWeight: 4,
    dashArray: null,          // solid
    label: 'Safest',
    icon: '🛡️',
  },
  balanced: {
    color: '#f4ad33',
    activeWeight: 6,
    inactiveWeight: 3,
    dashArray: '10 6',        // dashed
    label: 'Balanced',
    icon: '⚖️',
  },
  fastest: {
    color: '#e71b1b',
    activeWeight: 6,
    inactiveWeight: 3,
    dashArray: null,          // solid
    label: 'Fastest',
    icon: '⚡',
  },
};

export default function RoutePolylines({ routes, selectedRoute, reports = [], onSelectRoute }) {
  if (!routes) return null;

  return (
    <>
      {/* Inactive routes — visible but dimmed with their unique style */}
      {Object.entries(routes)
        .filter(([k]) => k !== selectedRoute)
        .map(([key, route]) => {
          const style = ROUTE_STYLES[key];
          return (
            <Polyline
              key={key}
              positions={route.coords}
              pathOptions={{
                color: style.color,
                weight: style.inactiveWeight,
                opacity: 0.3,
                dashArray: style.dashArray || undefined,
              }}
              eventHandlers={{ click: () => onSelectRoute(key) }}
            />
          );
        })}

      {/* Active route — full brightness with shadow depth */}
      {routes[selectedRoute] && (() => {
        const style = ROUTE_STYLES[selectedRoute];
        const coords = routes[selectedRoute].coords;
        return (
          <>
            {/* Drop shadow layer */}
            <Polyline
              positions={coords}
              pathOptions={{ color: '#000', weight: style.activeWeight + 5, opacity: 0.2 }}
            />
            {/* Glow layer */}
            <Polyline
              positions={coords}
              pathOptions={{ color: style.color, weight: style.activeWeight + 3, opacity: 0.25 }}
            />
            {/* Main active line */}
            <Polyline
              positions={coords}
              pathOptions={{
                color: style.color,
                weight: style.activeWeight,
                opacity: 1,
                dashArray: style.dashArray || undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        );
      })()}
    </>
  );
}