/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2333",       // primary text / headers
        slate: "#5B6478",      // secondary text
        canvas: "#F6F7F9",      // page background
        line: "#E4E7ED",         // hairlines / borders
        accent: "#3457D5",        // action color — links, primary buttons
        good: "#1F8A5F",            // pass / selected / accepted
        warn: "#B7791F",              // pending / review
        bad: "#C4432B",                 // fail / rejected / withdrawn
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
