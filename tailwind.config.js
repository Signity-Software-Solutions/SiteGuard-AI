/** Token-driven Tailwind config - same approach as the office AI Vision frontend (CSS vars → utilities). */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: c('page'),
        surface: c('surface'),
        raised: c('raised'),
        sunken: c('sunken'),
        line: c('line'),
        ink: c('ink'),
        sub: c('sub'),
        mute: c('mute'),
        brand: c('brand'),
        ok: c('ok'),
        warn: c('warn'),
        critical: c('critical'),
        high: c('high'),
        medium: c('medium'),
        low: c('low'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.08), 0 8px 24px -12px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'none' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.16,1,.3,1) both',
        'slide-in': 'slide-in .25s cubic-bezier(.16,1,.3,1) both',
        blink: 'blink 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
