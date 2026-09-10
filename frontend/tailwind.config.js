/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          900: '#070b14',
          850: '#0c1322',
          800: '#111b30',
          700: '#1b2a4a',
          600: '#253b65',
          border: '#1f2e4d',
          accent: '#00f0ff',
          neonGreen: '#00ff88',
          danger: '#ff3366',
          warning: '#ffb700'
        },
        navy: {
          DEFAULT: '#1E2761',
          dark: '#141A46',
          light: '#2A367E',
          soft: '#E8ECF8'
        },
        cyan: {
          DEFAULT: '#00C2CB',
          dark: '#009BA2',
          light: '#E0F9FB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        dyslexic: ['OpenDyslexic', 'Comic Sans MS', 'sans-serif']
      }
    },
  },
  plugins: [],
}

