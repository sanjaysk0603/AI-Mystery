/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        noir: '#0f172a',
        ember: '#f59e0b',
        fog: '#e2e8f0',
      },
      boxShadow: {
        glow: '0 0 30px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [],
};
