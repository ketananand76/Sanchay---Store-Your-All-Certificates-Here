/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          light: '#c084fc',
          DEFAULT: '#a855f7', // purple accent
          dark: '#7e22ce',
        },
        indian: {
          saffron: '#FF9933',
          emerald: '#128807',
          gold: '#D4AF37',
          marigold: '#F58220',
          peacock: '#005A9C',
        },
        dark: {
          bg: '#0a0a0f',
          card: '#12111d',
          border: '#231e3d',
          text: '#f3f4f6',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        accent: ['Cinzel', 'Playfair Display', 'serif'],
      },
      backgroundImage: {
        'mandala-pattern': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\" viewBox=\"0 0 80 80\"><path d=\"M40 0l3.8 23.4L63.6 10l-10 23.6L77.2 40l-23.6 3.8 10 23.6-19.8-13.4L40 80l-3.8-23.4L16.4 70l10-23.6L2.8 40l23.6-3.8-10-23.6 19.8 13.4z\" fill=\"%23a855f7\" fill-opacity=\"0.04\" fill-rule=\"evenodd\"/></svg>')",
      }
    },
  },
  plugins: [],
}
