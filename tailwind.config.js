/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      colors: {
        /* Design tokens */
        navy:    { DEFAULT: '#0D1B2E', light: '#111E30', medium: '#162338', card: '#EFF1F5' },
        'accent-blue': '#4A9EE0',

        /* Semantic */
        safe:    { DEFAULT: 'hsl(var(--safe))',    foreground: 'hsl(var(--safe-foreground))' },
        caution: { DEFAULT: 'hsl(var(--caution))', foreground: 'hsl(var(--caution-foreground))' },
        danger:  { DEFAULT: 'hsl(var(--danger))',  foreground: 'hsl(var(--danger-foreground))' },

        /* Base */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        chart:   { '1':'hsl(var(--chart-1))','2':'hsl(var(--chart-2))','3':'hsl(var(--chart-3))','4':'hsl(var(--chart-4))','5':'hsl(var(--chart-5))' },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      boxShadow: {
        'card':      '0 2px 16px rgba(0,0,0,0.2)',
        'card-lg':   '0 4px 32px rgba(0,0,0,0.25)',
        'blue':      '0 4px 20px rgba(74,158,224,0.3)',
        'danger':    '0 4px 20px rgba(239,68,68,0.35)',
        'neumorphic':'4px 4px 12px rgba(0,0,0,0.15), -2px -2px 8px rgba(255,255,255,0.6)',
        'inner-sm':  'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      keyframes: {
        'accordion-down': { from:{height:'0'}, to:{height:'var(--radix-accordion-content-height)'} },
        'accordion-up':   { from:{height:'var(--radix-accordion-content-height)'}, to:{height:'0'} },
        'fade-in-up':     { from:{opacity:'0',transform:'translateY(14px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        'scale-in':       { from:{opacity:'0',transform:'scale(0.94)'}, to:{opacity:'1',transform:'scale(1)'} },
        'sos-pulse':      { '0%':{transform:'scale(1)',opacity:'0.7'}, '100%':{transform:'scale(1.7)',opacity:'0'} },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in-up':     'fade-in-up 0.35s ease-out',
        'scale-in':       'scale-in 0.25s ease-out',
        'sos-pulse':      'sos-pulse 1.4s ease-out infinite',
      },
    },
  },
  safelist: [
    'bg-safe','text-safe','border-safe','bg-safe/10','bg-safe/20',
    'bg-caution','text-caution','border-caution','bg-caution/10',
    'bg-danger','text-danger','border-danger','bg-danger/10',
    'bg-accent-blue','text-accent-blue','border-accent-blue',
  ],
  plugins: [require("tailwindcss-animate")],
};
