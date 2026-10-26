// Experiment 1: Tailwind theme (colours and fonts taken from the farm and the mandi)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: { paddy: '#2E6B3A', turmeric: '#E8A317', soil: '#33261B', grain: '#F5F6EF', mist: '#DDE8DA' },
    fontFamily: { sans: ['Mukta', 'system-ui', 'sans-serif'], display: ['"Baloo 2"', 'Mukta', 'sans-serif'] }
  } },
  plugins: []
};
