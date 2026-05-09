import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n.jsx';
import { useAppContext } from '@/lib/AppContext.jsx';
import { motion } from 'framer-motion';
import { Navigation, X, RotateCw, MapPin, Clock, Shield, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MapView from '@/components/map/MapView';
import SafetyBadge from '@/components/common/SafetyBadge';
import { cn } from '@/lib/utils';

export default function NavigationMode({ route, destination, onEnd }) {
  const { t } = useLanguage();
  const { isTracking, setIsTracking } = useAppContext();
  const [eta, setEta] = useState(route.duration);

  useEffect(() => {
    setIsTracking(true);
    const interval = setInterval(() => {
      setEta(prev => Math.max(0, prev - 1));
    }, 3000);
    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [setIsTracking]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            route.type === 'safest' ? 'bg-safe' : route.type === 'balanced' ? 'bg-caution' : 'bg-danger'
          )} />
          <div>
            <p className="text-sm font-semibold text-foreground">{t('navigating')}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{destination}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEnd}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView height="100%" className="rounded-none" />

        {/* ETA overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-foreground">{eta}</span>
              <span className="text-xs text-muted-foreground">{t('min')}</span>
            </div>
          </div>
          <SafetyBadge score={route.safetyScore} />
        </div>

        {/* Live tracking indicator */}
        {isTracking && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-safe/90 text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {t('liveTracking')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="bg-card border-t border-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{route.distance} {t('km')}</span>
            <span className="text-muted-foreground">{eta} {t('min')}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            <Share2 className="w-3.5 h-3.5" />
            {t('shareTracking')}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs" onClick={onEnd}>
            <RotateCw className="w-3.5 h-3.5 mr-1" /> {t('reRoute')}
          </Button>
          <Button variant="destructive" className="flex-1 rounded-xl h-10 text-xs" onClick={onEnd}>
            <X className="w-3.5 h-3.5 mr-1" /> {t('endNavigation')}
          </Button>
        </div>
      </div>
    </div>
  );
}