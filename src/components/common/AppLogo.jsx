export default function AppLogo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { img: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-base', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-2xl', sub: 'text-sm' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0">
        <img
          src="https://media.base44.com/images/public/69e449b5017790d72143e6e1/d2ca05de1_logosafenav.jpeg"
          alt="SafeNav360X Logo"
          className={`${s.img} rounded-2xl object-cover`}
          style={{ boxShadow: '0 0 16px rgba(79,70,229,0.4), 0 2px 8px rgba(0,0,0,0.3)' }}
        />
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background"
          style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${s.text} font-black tracking-tight`}>
            <span className="text-foreground">Safe</span>
            <span style={{
              background: 'linear-gradient(135deg, #4F46E5, #22D3EE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Nav360X</span>
          </span>
          <span className={`${s.sub} text-muted-foreground font-medium`}>Smart Safety Navigation</span>
        </div>
      )}
    </div>
  );
}