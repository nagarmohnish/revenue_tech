import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f9f0',
          100: '#c8f0dc',
          200: '#92e3bd',
          300: '#5cd49d',
          400: '#2bbd7e',
          500: '#10a868',
          600: '#0a8a55',
          700: '#0a6e45',
          800: '#0b5638',
          900: '#0a3f2a',
        },
        ink: {
          50:  '#f5faf7',
          100: '#eef4f1',
          200: '#e2ebe6',
          300: '#c2d2cb',
          400: '#93aaa0',
          500: '#618376',
          600: '#3d6557',
          700: '#1d4b3c',
          800: '#10392c',
          900: '#0a2b21',
          950: '#06221a',
        },
        coral: { 400: '#ff8a5c', 500: '#f2683c', 600: '#dc4f23' },
        // Legacy "accent" alias maps to brand so internal app pages (dashboard, billing) keep rendering
        accent: {
          50:  '#e8f9f0',
          100: '#c8f0dc',
          200: '#92e3bd',
          300: '#5cd49d',
          400: '#2bbd7e',
          500: '#10a868',
          600: '#0a8a55',
          700: '#0a6e45',
          800: '#0b5638',
          900: '#0a3f2a',
        },
        ok:   '#10a868',
        warn: '#f59e0b',
        bad:  '#dc4f23',
      },
      fontFamily: {
        sans:    ['var(--font-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-sans)', 'Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(6,34,26,0.04)',
        pop:  '0 30px 60px -28px rgba(6,34,26,0.28)',
        cta:  '0 10px 24px -10px rgba(16,168,104,0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
