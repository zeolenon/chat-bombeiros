import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cbm-red": "#dc2626",
        "cbm-blue": "#1d4ed8",
      },
      animation: {
        "bounce-slow": "bounce 1.5s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
