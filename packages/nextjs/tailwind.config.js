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
          primary: "#6d28d9",
          
          "primary-content": "#ded8fb",
                    
          secondary: "#a21caf",
                    
          "secondary-content": "#efd6f1",
                    
          accent: "#62a900",
                    
          "accent-content": "#030a00",
                    
          neutral: "#1d1617",
                    
          "neutral-content": "#cccacb",
                    
          "base-100": "#bebeb2",
                    
          "base-200": "#a5a59a",
                    
          "base-300": "#8c8c83",
                    
          "base-content": "#0d0d0c",
                    
          info: "#00d2ff",
                    
          "info-content": "#001016",
                    
          success: "#81e36e",
                    
          "success-content": "#061204",
                    
          warning: "#ffb400",
                    
          "warning-content": "#160c00",
                    
          error: "#cc2633",
                    
          "error-content": "#fbd8d5",

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
            backgroundColor: "#bebeb2",
            borderColor: "#120916",
            color: "#161612",
          },
          
          ".Contract-modal-content": {
            backgroundColor: "#bebeb2",
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
