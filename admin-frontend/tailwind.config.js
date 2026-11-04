/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        cyber: {
          blue: '#00D2FF',
          purple: '#9B51E0',
          pink: '#FF2A85',
          green: '#00F5A0',
          amber: '#FFB800',
          coral: '#FF5E62',
        },
        sidebar: {
          light: '#ffffff',
          dark: '#0B0F19',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-aurora': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 50%, #9B51E0 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #FF5E62 0%, #FF9966 50%, #FFD166 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)',
        'gradient-neon-pink': 'linear-gradient(135deg, #FF2A85 0%, #9B51E0 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #111827 0%, #1F2937 50%, #111827 100%)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.15) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-primary': '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
        'glow-secondary': '0 10px 30px -5px rgba(168, 85, 247, 0.4)',
        'glow-accent': '0 10px 30px -5px rgba(249, 115, 22, 0.4)',
        'glow-success': '0 10px 30px -5px rgba(16, 185, 129, 0.4)',
        'glow-rose': '0 10px 30px -5px rgba(244, 63, 94, 0.4)',
        'glow-cyan': '0 10px 30px -5px rgba(6, 182, 212, 0.4)',
        'glow-amber': '0 10px 30px -5px rgba(245, 158, 11, 0.4)',
        'glow-pink': '0 10px 30px -5px rgba(236, 72, 153, 0.4)',
        'card-hover': '0 20px 35px -10px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-colored': '0 12px 30px -10px var(--card-glow-color, rgba(99, 102, 241, 0.25))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
