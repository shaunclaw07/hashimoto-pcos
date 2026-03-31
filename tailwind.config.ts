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
        // Primary - Calming lavender for women 30-60
        primary: {
          DEFAULT: "#8B7CB5",
          50: "#F3F0F7",
          100: "#E8E1F0",
          200: "#D4C9E2",
          300: "#B8A8CC",
          400: "#9B87B5",
          500: "#8B7CB5",
          600: "#7A68A8",
          700: "#65548C",
          800: "#544573",
          900: "#463960",
          950: "#2E2640",
          foreground: "#FFFFFF",
        },
        // Secondary - Sage green (natural, warm)
        secondary: {
          DEFAULT: "#5B8F7B",
          50: "#EDF5F1",
          100: "#D5EAE0",
          200: "#ABD5C1",
          300: "#81C0A2",
          400: "#5B8F7B",
          500: "#4A7A68",
          600: "#3D6556",
          700: "#325147",
          800: "#284039",
          900: "#1F332D",
          950: "#152219",
          foreground: "#FFFFFF",
        },
        // Accent - Warm terracotta
        accent: {
          DEFAULT: "#D4956A",
          50: "#FBF4EE",
          100: "#F5E6D8",
          200: "#E8CDB3",
          300: "#DAB48D",
          400: "#D4956A",
          500: "#C47D4F",
          600: "#A86840",
          700: "#8C5434",
          800: "#70442B",
          900: "#5C3824",
          950: "#3D2417",
          foreground: "#FFFFFF",
        },
        // Background - warm tones
        background: {
          DEFAULT: "#FEFEFA",
          warm: "#F5F0E8",
          cream: "#FAF8F5",
          foreground: "#2D2A32",
        },
        // Foreground text color
        foreground: {
          DEFAULT: "#2D2A32",
          muted: "#6B6560",
        },
        // Surface for cards
        surface: {
          DEFAULT: "#FFFFFF",
          warm: "#F5F0E8",
          muted: "#F0EDE8",
        },
        // Score colors (kept for consistency)
        score: {
          sehr_gut: "#22c55e",
          gut: "#84cc16",
          neutral: "#eab308",
          weniger_gut: "#f97316",
          vermeiden: "#ef4444",
        },
        // Card colors
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2D2A32",
        },
        // Border colors
        border: {
          DEFAULT: "#E8E4DF",
          warm: "#D9D4CC",
        },
        // Ring color
        ring: {
          DEFAULT: "#8B7CB5",
        },
        // Input colors
        input: {
          DEFAULT: "#E8E4DF",
        },
        // Muted
        muted: {
          DEFAULT: "#F0EDE8",
          foreground: "#6B6560",
        },
        // Destructive
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        // Popover
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2D2A32",
        },
      },
      fontSize: {
        // Base 16px minimum for readability
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.35" }],
        "4xl": ["2.25rem", { lineHeight: "1.3" }],
      },
      spacing: {
        // Touch-friendly spacing (44px minimum)
        "touch-sm": "2.75rem",
        "touch-md": "3rem",
        "touch-lg": "3.5rem",
      },
      borderRadius: {
        DEFAULT: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 8px 0 rgba(139, 124, 181, 0.08)",
        card: "0 4px 12px 0 rgba(139, 124, 181, 0.1)",
        lifted: "0 8px 24px 0 rgba(139, 124, 181, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
