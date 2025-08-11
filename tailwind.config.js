/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode support for future enhancement
  theme: {
    extend: {
      colors: {
        // Custom colors matching mock.html design
        primary: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bbd4ff',
          300: '#8cb8ff',
          400: '#5693ff',
          500: '#1f6feb', // Main primary color from mock.html
          600: '#0c4a9e',
          700: '#0a3d82',
          800: '#0c3366',
          900: '#102a4c',
        },
        background: {
          DEFAULT: '#f6f7fb', // Body background from mock.html
          panel: '#ffffff',   // Panel background
          table: '#fbfdff',   // Table header background
        },
        border: {
          DEFAULT: '#e3e6ee', // Default border color
          light: '#e9edf5',   // Light border for calendar
          input: '#e6e9f6',   // Input border
          button: '#cfd8f7',  // Button border
        },
        event: {
          background: '#fffbeb', // Event background
          border: '#fde3a7',     // Event border
        },
        text: {
          primary: '#222222',   // Main text color
          secondary: '#666666', // Secondary text color  
          muted: '#6b7280',     // Muted/gray text
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Hiragino Kaku Gothic ProN',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      minHeight: {
        'calendar-day': '80px', // Calendar day minimum height
      },
      gridTemplateColumns: {
        'calendar': 'repeat(7, 1fr)', // Calendar grid
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};