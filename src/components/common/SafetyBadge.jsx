import { cn } from '@/lib/utils';
import { ShieldCheck, Shield, ShieldAlert } from 'lucide-react';

export default function SafetyBadge({ score, size = 'md' }) {
  const getConfig = () => {
    if (score >= 80) return {
      color: '#10B981', bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.25)', icon: ShieldCheck, label: 'Safe',
      glow: '0 0 12px rgba(16,185,129,0.35)',
    };
    if (score >= 55) return {
      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.25)', icon: Shield, label: 'Moderate',
      glow: '0 0 12px rgba(245,158,11,0.35)',
    };
    return {
      color: '#EF4444', bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.25)', icon: ShieldAlert, label: 'Risky',
      glow: '0 0 12px rgba(239,68,68,0.35)',
    };
  };

  const config = getConfig();
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs"
      )}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        boxShadow: config.glow,
      }}
    >
      <Icon className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{score}</span>
      <span className="opacity-70">{config.label}</span>
    </div>
  );
}