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
        blue: {
          DEFAULT: '#4A80C4',
          light: '#6B9FD8',
          dark: '#355F96',
        },
        green: {
          DEFAULT: '#558A55',
          light: '#6EAA6E',
          dark: '#3A6B3A',
        },
        cream: '#E8E4DC',
        muted: '#7A756E',
        dim: '#3A3733',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
