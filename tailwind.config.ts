import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald scale — the app's single accent color (Stripe/Vercel-style
        // "SaaS Executive Pro" palette). #059669 (600) is the primary accent.
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        ink: "#0f172a",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
        "soft-lg": "0 4px 8px -2px rgba(15, 23, 42, 0.06), 0 12px 24px -6px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
