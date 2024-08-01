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
          
          primary: "#987D9A",
                    
          "primary-content": "#080509",
                    
          secondary: "#bb9ab1",
                    
          "secondary-content": "#0d090c",
                    
          accent: "#eeceb9",
                    
          "accent-content": "#140f0d",
                    
          neutral: "#fefbd9",
                    
          "neutral-content": "#161511",
                    
          "base-100": "#F3FEB8",
                    
          "base-200": "#d3dda0",
                    
          "base-300": "#b4bd88",
                    
          "base-content": "#14160c",
                    
          info: "#00b9ff",
                    
          "info-content": "#000d16",
                    
          success: "#00b060",
                    
          "success-content": "#000b03",
                    
          warning: "#9c5800",
                    
          "warning-content": "#ecddd0",
                    
          error: "#d30238",
                    
          "error-content": "#fdd6d5",

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
