import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102a43",
        ember: "#f25f5c",
        sky: "#0f7bff",
        mist: "#f7fafc",
        dune: "#ffd9a0"
      },
      boxShadow: {
        panel: "0 30px 80px rgba(16, 42, 67, 0.18)",
        soft: "0 8px 24px rgba(16, 42, 67, 0.12)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      },
      animation: {
        floatIn: "floatIn 450ms ease-out both",
        shimmer: "shimmer 1.8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
