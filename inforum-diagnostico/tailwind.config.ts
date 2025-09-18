
import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: { colors: { brand: { primary: '#0B3B8F', secondary: '#00AEEF', accent: '#00C389', dark: '#0F172A', light: '#E6EEF9' } } },
  },
  plugins: [],
} satisfies Config
