/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ Đảm bảo có dòng này
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0ea5e9",
      },
      keyframes: {
        scan: {
          "0%, 100%": { top: "8px" },
          "50%": { top: "calc(100% - 8px)" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}