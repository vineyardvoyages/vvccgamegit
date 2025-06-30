/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'vineyard-purple': '#6b2a58',
        'vineyard-green': '#9CAC3E',
        'vineyard-dark-green': '#496E3E'
      }
    },
  },
  plugins: [],
}
