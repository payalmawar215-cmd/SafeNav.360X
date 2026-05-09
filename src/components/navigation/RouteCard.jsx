import { useLanguage } from '@/lib/i18n.jsx';
import { motion } from 'framer-motion';
import { Clock, Route, Shield, ShieldCheck, ShieldAlert, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import SafetyBadge from '@/components/common/SafetyBadge';

export default function RouteCard({ route, isSelected, onSelect, delay = 0 }) {
  const { t } = useLanguage();

  const typeConfig = {
    safest: { label: t('safestRoute'), icon: ShieldCheck, accent: 'border-safe', dotColor: 'bg-safe' },
    balanced: { label: t('balancedRoute'), icon: Shield, accent: 'border-caution', dotColor: 'bg-caution' },
    fastest: { label: t('fastestRoute'), icon: Zap, accent: 'border-danger', dotColor: 'bg-danger' },
  };

  const config = typeConfig[route.type];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onSelect}
      className={cn(
        "w-full bg-card rounded-2xl border-2 p-4 text-left transition-all",
        isSelected ? `${config.accent} shadow-md` : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
          <span className="text-sm font-semibold text-foreground">{config.label}</span>
        </div>
        <SafetyBadge score={route.safetyScore} size="sm" />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {route.duration} {t('min')}
        </span>
        <span className="flex items-center gap-1">
          <Route className="w-3 h-3" /> {route.distance} {t('km')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {route.highlights.map((h, i) => (
          <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            {h}
          </span>
        ))}
      </div>
    </motion.button>
  );
}