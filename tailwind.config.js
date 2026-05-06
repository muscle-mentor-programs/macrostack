/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0A',
        surface: '#141412',
        card: '#1C1A18',
        border: '#2A2724',
        brown: {
          DEFAULT: '#9A7B55',
          light: '#B8996F',
          dark: '#7A5F3E',
        },
        olive: {
          DEFAULT: '#6B7A52',
          light: '#849663',
          dark: '#525E3E',
        },
        slategray: {
          DEFAULT: '#5A6472',
          light: '#8A9AB0',
          dark: '#424D59',
        },
        cream: '#E8E4DC',
        muted: '#7A756E',
        dim: '#3A3733',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
