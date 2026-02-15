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
        background: "var(--background)",
        foreground: "var(--foreground)",
        claw: {
          bg: "#0E0E11",
          red: "#FF2E2E",
          green: "#00FF94", // Neon green
          subtle: "#1F1F24", // Card bg
          text: "#E0E0E0",
          dim: "#888888",
        }
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FF2E2E20' },
          '100%': { boxShadow: '0 0 20px #FF2E2E60' }
        }
      }
    },
  },
  plugins: [],
};
export default config;
