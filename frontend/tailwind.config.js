/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          50: '#E8F0F7',
          100: '#C5D9EB',
          200: '#9DBFDD',
          300: '#75A5CF',
          400: '#4D8BC1',
          500: '#0F4C81',
          600: '#0D4373',
          700: '#0A3660',
          800: '#08294A',
          900: '#051C33'
        },
        accent: {
          DEFAULT: '#FF8A00',
          50: '#FFF3E5',
          100: '#FFE0BF',
          200: '#FFCC99',
          300: '#FFB866',
          400: '#FFA333',
          500: '#FF8A00',
          600: '#E67A00',
          700: '#CC6B00',
          800: '#B35C00',
          900: '#994D00'
        },
        neutral: {
          bg: '#F5F7FA',
          surface: '#FFFFFF'
        },
        success: '#16A34A',
        danger: '#DC2626'
      }
    },
  },
  plugins: [],
}
