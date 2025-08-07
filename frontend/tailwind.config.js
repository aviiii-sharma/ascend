/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // The extend object is now correctly populated
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        'brand-dark': '#111111',
        'brand-gray': {
          DEFAULT: '#A0A0A0',
          dark: '#333333',
          light: '#E0E0E0',
        },
        'primary-purple': '#8E2DE2',
        'dark-purple': '#4A00E0',
        'card-bg': 'rgba(28, 28, 28, 0.8)',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(90deg, #8E2DE2, #4A00E0)',
        'cursor-gradient': 'radial-gradient(circle, rgba(142, 45, 226, 0.15), transparent 60%)',
      },
      maxWidth: {
        '6xl': '1100px',
      },
      boxShadow: {
        'purple-glow': '0 4px 20px rgba(142, 45, 226, 0.5)',
        'card-hover': '0 8px 25px rgba(0, 0, 0, 0.3)',
        'card-hover-lg': '0 10px 30px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}