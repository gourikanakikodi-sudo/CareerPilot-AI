export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#050816',
        electric: '#7c3aed',
        neon: '#22d3ee',
      },
      boxShadow: {
        glow: '0 0 40px rgba(34,211,238,0.25)',
      },
    },
  },
  plugins: [],
}
