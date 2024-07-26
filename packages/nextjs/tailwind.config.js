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
          
          primary: "#f100a7",
          "primary-content": "#14000a",
          secondary: "#00b900",
          "secondary-content": "#000d00",
          accent: "#007aff",
          "accent-content": "#000516",
          neutral: "#fff9b4",
          "neutral-content": "#16150c",
          "base-100": "#fffde3",
          "base-200": "#dedcc5",
          "base-300": "#bebca8",
          "base-content": "#161612",
          info: "#00c5ff",
          "info-content": "#000e16",
          success: "#00c96d",
          "success-content": "#000f04",
          warning: "#fec800",
          "warning-content": "#160f00",
          error: "#e20a39",
          "error-content": "#ffd8d6",

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
            borderColor: "#120916",
            color: "#120916",
          },

          ".modal-form-control": {
            backgroundColor: "#fffff0",
            borderColor: "#120916",
            color: "#161612",
          },
          
          ".Contract-modal-content": {
            backgroundColor: "#fffde3",
            color: "#120916",
          },
          ".modal-content":{
            backgroundColor: "#dedcc5",
          },
          ".text-theme":{
            color: "#161612",
          },
          "barColor" : {
            barColor: '#00b900',
          }
        },
      },
      {
        dark: {
            primary: "#C738BD",                     
            "primary-content": "#0e010d",
            secondary: "#AF47D2",                     
            "secondary-content": "#F9FBFF",                     
            accent: "#E49BFF",                     
            "accent-content": "#120916",                     
            neutral: "#F9FBFF",                     
            "neutral-content": "#151516",                     
            "base-100": "#850F8D",                     
            "base-200": "#730b7a",                     
            "base-300": "#610867",                     
            "base-content": "#e8d2e9",                     
            info: "#604CC3",                     
            "info-content": "#dcdbf6",                     
            success: "#80C4E9",                     
            "success-content": "#060e13",                     
            warning: "#FFDB00",                     
            "warning-content": "#161100",                     
            error: "#dc2626",
            "text-accent": "#e0cfe1",
            "error-content": "#ffd9d4",
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
            backgroundColor: "#E49BFF",
            borderColor: "#0e010d",
            color: "#161612",
          },
          ".form-control": {
            backgroundColor: "#E49BFF",
            color: "#0e010d",
            placeholder: "#dad7f6",
            placeholderColor: "#dad7f6",
          },
          ".Contract-modal-content": {
            backgroundColor: "#850F8D",
            color: "#F9FBFF",
          },
          ".modal-content":{
            backgroundColor: "#850F8D",
            color: "#F9FBFF",
          },
          ".text-theme":{
            color: "#e8d2e9",
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
