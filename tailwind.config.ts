import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand — Safety Orange (concept-9)
        saf: {
          50:  '#fff1e6',
          100: '#ffd9b8',
          200: '#ffbf85',
          300: '#ffa552',
          400: '#ff8a1f',
          500: '#FF7A1A',  // the canonical brand orange
          600: '#e6620a',
          700: '#b34a04',
          800: '#803302',
          900: '#4d1c00',
        },
        // Ink — near-black surface palette
        ink: {
          50:  '#F2F2F0',   // body text on dark bg
          100: '#d6d6d2',
          200: '#a6a6a0',
          300: '#7a7a74',
          400: '#525252',
          500: '#363639',
          600: '#26262a',
          700: '#1d1d21',
          800: '#17171C',   // elevated card surface
          900: '#121215',
          950: '#101014',   // primary background
        },
        // Legacy 'brand' alias → safety orange so old code keeps rendering
        brand: {
          50:  '#fff1e6',
          100: '#ffd9b8',
          200: '#ffbf85',
          300: '#ffa552',
          400: '#ff8a1f',
          500: '#FF7A1A',
          600: '#e6620a',
          700: '#b34a04',
          800: '#803302',
          900: '#4d1c00',
        },
        accent: {
          50:  '#fff1e6',
          100: '#ffd9b8',
          200: '#ffbf85',
          300: '#ffa552',
          400: '#ff8a1f',
          500: '#FF7A1A',
          600: '#e6620a',
          700: '#b34a04',
          800: '#803302',
          900: '#4d1c00',
        },
        coral: { 400: '#ff8a5c', 500: '#f2683c', 600: '#dc4f23' },
        ok:   '#FF7A1A',
        warn: '#FF7A1A',
        bad:  '#FF7A1A',
      },
      fontFamily: {
        sans:    ['Archivo', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', 'Archivo', 'sans-serif'],
        mono:    ['"Martian Mono"', 'JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,122,26,0.04)',
        pop:  '0 0 50px rgba(255,122,26,0.12)',
        cta:  '0 0 30px rgba(255,122,26,0.4)',
        glow: '0 0 14px rgba(255,122,26,0.55)',
      },
      borderRadius: {
        // Concept-9 uses ZERO border-radius. Override Tailwind defaults to be sharp by default.
        none: '0',
        sm:   '0',
        DEFAULT: '0',
        md:   '0',
        lg:   '0',
        xl:   '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',  // keep only for explicit pill/circle shapes
      },
      letterSpacing: {
        widest: '0.18em',
      },
      keyframes: {
        lgblink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '.25' },
        },
        lgpulse: {
          '0%':   { transform: 'scale(1)',   opacity: '.5' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        lgblink: 'lgblink 1.8s ease-in-out infinite',
        lgpulse: 'lgpulse 2.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
