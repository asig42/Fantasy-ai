/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif-kr': ['Noto Serif KR', 'serif'],
        'sans-kr': ['Noto Sans KR', 'sans-serif'],
        'cinzel': ['Cinzel', 'serif'],
      },
      colors: {
        'fantasy': {
          'gold': '#D4AF37',
          'dark': '#0a0a0f',
          'darker': '#050508',
          'panel': 'rgba(10, 10, 20, 0.85)',
          'border': '#3d2e1a',
          'text': '#e8d5b0',
          'text-dim': '#a09070',
          'accent': '#8B4513',
          'purple': '#4a1060',
          'crimson': '#8b0000',
        }
      },
      backgroundImage: {
        'fantasy-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%)',
        'panel-gradient': 'linear-gradient(180deg, rgba(10,10,20,0.9) 0%, rgba(5,5,10,0.95) 100%)',
        'gold-gradient': 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'typewriter': 'typewriter 2s steps(40) forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #D4AF37, 0 0 10px #D4AF37' },
          '100%': { textShadow: '0 0 10px #D4AF37, 0 0 20px #D4AF37, 0 0 30px #D4AF37' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'fantasy': '0 0 20px rgba(212, 175, 55, 0.2), 0 0 40px rgba(212, 175, 55, 0.1)',
        'panel': '0 4px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(212, 175, 55, 0.1)',
      },
    },
  },
  plugins: [],
}
