import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Score colors
        score: {
          sehr_gut: "#22c55e",
          gut: "#84cc16",
          neutral: "#eab308",
          weniger_gut: "#f97316",
          vermeiden: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
