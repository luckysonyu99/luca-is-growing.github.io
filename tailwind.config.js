/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#FFE5E5',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#FF1A1A',
          600: '#FF0000',
        },
        secondary: {
          100: '#E5F2FF',
          200: '#B3D9FF',
          300: '#80C0FF',
          400: '#4DA6FF',
          500: '#1A8CFF',
          600: '#0073E6',
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        cupcake: {
          ...require("daisyui/src/theming/themes")["cupcake"],
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFD93D",
        },
      },
    ],
  },
} 