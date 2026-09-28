/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        navy: "#0B1F3A",
        navy2: "#163E68",
        blue: "#1D5FA7",
        blue2: "#EAF2FB",
        saffron: "#D47A16",
        green: "#17734A",
        green2: "#E8F5EE",
        bgApp: "#F4F7FA",
        card: "#ffffff",
        text: "#172033",
        muted: "#657083",
        line: "#DDE3EA",
        soft: "#F8FAFC",
      },

      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
      },

      boxShadow: {
        card: "0 12px 32px rgba(11, 31, 58, .08)",
        cardHover: "0 18px 40px rgba(11, 31, 58, .13)",
        featured: "0 8px 18px rgba(11, 31, 58, .18)",
        modal: "0 24px 60px rgba(11, 31, 58, .3)",
      },

      maxWidth: {
        wrap: "96vw",
      },

      keyframes: {
        modalIn: {
          from: {
            opacity: 0,
            transform: "translateY(10px) scale(.98)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        },

        blink: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.25",
          },
        },
      },

      animation: {
        modalIn: "modalIn .22s cubic-bezier(.2,.8,.2,1)",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};