/** @type {import('tailwindcss').Config} */
/**
 * EquiTrack design tokens (Tailwind config)
 * ------------------------------------------------------------------
 * Look & feel comes from the Canva screens: dark charcoal surfaces,
 * lime + blue logo accents, green pill buttons, cream inputs.
 *
 * ROLE OF EACH COLOR
 *   primary   green  -> main buttons, links, focus
 *   secondary blue   -> headings/labels (logo blue)
 *   accent    lime   -> page titles, active nav, highlights (logo lime)
 *   surface   dark neutrals -> page / card / sidebar backgrounds
 *   status    amber/blue/green/red -> Pending / In Progress / Solved / Urgent
 *
 * CONTRAST NOTES (WCAG AA = 4.5:1 for normal text)
 *   white on primary-btn (#468006)  = 4.8:1   OK
 *   primary (#66aa0c) on surface-base (#29292e) = 5.3:1  OK (use for text on dark)
 *   secondary-300 (#7e9bf0) on surface-base = 5.4:1  OK (the raw logo blue #3b5fc0 is too dark for text)
 *   ink (#1b1b1f) on cream (#fdfdf0) = 16:1  OK
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#66aa0c',   // green for text/borders on dark backgrounds
          btn: '#468006',       // green for button FILLS with white text
          hover: '#3f6b00',
          light: '#8fd23a',
        },
        secondary: {
          DEFAULT: '#3b5fc0',   // logo blue (fills, borders)
          300: '#7e9bf0',       // readable blue for text on dark
          400: '#5a7fe0',
        },
        accent: {
          DEFAULT: '#b5f26e',   // logo lime
          dark: '#9ad84f',
        },
        surface: {
          nav: '#000000',       // navbar + sidebar
          base: '#29292e',      // page background
          sunken: '#1d1d21',    // inputs on cards, table headers
          raised: '#424245',    // cards / panels
          line: '#55555b',      // borders
        },
        cream: '#fdfdf0',       // light inputs
        ink: '#1b1b1f',         // text on cream
        muted: '#b4b4ba',       // secondary text (7.4:1 on base)
        status: {
          pending: '#e6a317',   // amber
          progress: '#4d8dff',  // blue
          solved: '#66aa0c',    // green
          urgent: '#d6204f',    // red
        },
        danger: { DEFAULT: '#c8174a', light: '#ff7a9a' },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['Jost', '"Hanken Grotesk"', 'sans-serif'],
      },
      // Type scale: display (hero) > h1 > h2 > h3 > body > small > tiny
      fontSize: {
        tiny: ['0.75rem', { lineHeight: '1rem' }],
        small: ['0.875rem', { lineHeight: '1.25rem' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h2: ['1.625rem', { lineHeight: '2rem', fontWeight: '700' }],
        h1: ['2.125rem', { lineHeight: '2.5rem', fontWeight: '800' }],
        display: ['clamp(2.25rem, 6vw, 4rem)', { lineHeight: '1.05', fontWeight: '800' }],
      },
      borderRadius: { pill: '9999px', card: '1.25rem' },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        focus: '0 0 0 3px rgba(181,242,110,0.55)',
      },
      keyframes: {
        'toast-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: { 'toast-in': 'toast-in 0.2s ease-out' },
    },
  },
  plugins: [],
};
