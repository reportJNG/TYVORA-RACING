/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          contrast: 'var(--accent-contrast)',
          subtle: 'var(--accent-subtle)',
        },
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Outfit"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        s: 'var(--radius-s)',
        m: 'var(--radius-m)',
      },
      letterSpacing: {
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.12em',
      },
    },
  },
  plugins: [],
};
