import { useAppContext } from '@/lib/AppContext.jsx';
import { Battery, Signal, WifiOff } from 'lucide-react';

export default function StatusBar() {
  const { isOnline, batteryLevel, networkType } = useAppContext();

  const batteryColor = batteryLevel > 50 ? '#10B981' : batteryLevel > 20 ? '#F59E0B' : '#EF4444';
  const batteryGlow = batteryLevel > 50
    ? '0 0 8px rgba(16,185,129,0.5)'
    : batteryLevel > 20
      ? '0 0 8px rgba(245,158,11,0.5)'
      : '0 0 8px rgba(239,68,68,0.5)';

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 text-xs"
      style={{
        background: 'rgba(11,15,26,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Signal className="w-3 h-3" style={{ color: '#10B981', filter: '0 0 6px rgba(16,185,129,0.6)' }} />
            <span className="font-semibold" style={{ color: '#10B981' }}>{networkType}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <WifiOff className="w-3 h-3 text-danger" />
            <span className="font-semibold text-danger">Offline</span>
          </div>
        )}
        <span className="text-muted-foreground/50 font-mono text-[10px]">SafeNav360X</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{
            background: `rgba(${batteryLevel > 50 ? '16,185,129' : batteryLevel > 20 ? '245,158,11' : '239,68,68'}, 0.1)`,
            border: `1px solid rgba(${batteryLevel > 50 ? '16,185,129' : batteryLevel > 20 ? '245,158,11' : '239,68,68'}, 0.25)`,
          }}>
          <Battery className="w-3.5 h-3.5" style={{ color: batteryColor, filter: batteryGlow }} />
          <span className="font-semibold" style={{ color: batteryColor }}>{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );
}