/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  // DaisyUI theme colors
  daisyui: {
    themes: [
      {
        light: {
          primary: "#93BBFB",
          "primary-content": "#080d15",
          secondary: "#DAE8FF",
          "secondary-content": "#111316",
          accent: "#93BBFB",
          "accent-content": "#080d15",
          neutral: "#212638",
          "neutral-content": "#cdcfd4",
          "base-100": "#ffffff",
          "base-200": "#dedede",
          "base-300": "#bebebe",
          "base-content": "#161616",
          info: "#87CEEB",
          "info-content": "#080d15",
          success: "#34EEB6",
          "success-content": "#01140c",
          warning: "#FFCF72",
          "warning-content": "#161004",
          error: "#FF8863",
          "error-content": "#160603",

          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
          
          ".form-control": {
            backgroundColor: "#fffff0",
            borderColor: "#bebebe",
            color: "#120916",
          },

          ".modal-form-control": {
            backgroundColor: "#bebeb2",
            borderColor: "#120916",
            color: "#161612",
          },
          
          ".Contract-modal-content": {
            backgroundColor: "#bebeb2",
            color: "#120916",
          },
          ".modal-content":{
            backgroundColor: "#dedede",
          },
          ".text-theme":{
            color: "#25292e",
          },
          "barColor" : {
            barColor: '#00b900',
          }
        },
      },
      {
        dark: {
          primary: "#212638",
          "primary-content": "#cdcfd4",
          secondary: "#323F61",
          "secondary-content": "#d2d6de",
          accent: "#4969A6",
          "accent-content": "#d8e0ee",
          neutral: "#F9FBFF",
          "neutral-content": "#151516",
          "base-100": "#385183",
          "base-200": "#2f4571",
          "base-300": "#273a60",
          "base-content": "#d4dae6",
          info: "#87CEEB",
          "info-content": "#060f13",
          success: "#34EEB6",
          "success-content": "#01140c",
          warning: "#FFCF72",
          "warning-content": "#161004",
          error: "#FF8863",
          "error-content": "#160603",
          
          "--rounded-btn": "9999rem",

          ".tooltip": {
            "--tooltip-tail": "6px",
            "--tooltip-color": "#F9FBFF",
          },
          ".link": {
            textUnderlineOffset: "2px",
          },
          ".link:hover": {
            opacity: "80%",
          },
          ".modal-form-control": {
            backgroundColor: "#2A3655",
            borderColor: "#0e010d",
            color: "#ffffff",
          },
          ".form-control": {
            backgroundColor: "#2A3655",
            color: "#ffffff",
            placeholder: "#ffffff",
            placeholderColor: "#ffffff",
          },
          ".Contract-modal-content": {
            backgroundColor: "#2A3655",
            color: "#F9FBFF",
          },
          ".modal-content":{
            backgroundColor: "#2A3655",
            color: "#F9FBFF",
          },
          ".text-theme":{
            color: "#ffffff",
          },
          "barColor" : {
            fill: '#AF47D2',
          }
        },
      },
    ],
  },
  theme: {
    extend: {
      dropShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      },
    },
  },
};
