import { Config } from "tailwindcss"

export default {
content: [
    "./{stage,control}.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

