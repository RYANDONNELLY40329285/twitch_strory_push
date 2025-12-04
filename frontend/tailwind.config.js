/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        discordDark: "#1e1f22",
        discordDarker: "#18191c",
        discordRed: "#ed4245",
        discordRedDark: "#a12829",
      }
    },
  },
  plugins: [],
};
