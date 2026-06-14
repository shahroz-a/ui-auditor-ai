import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx,css}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f8fb",
          100: "#eef1f5",
          600: "#526071",
          900: "#101828"
        },
        mint: {
          500: "#19a974",
          600: "#138a60"
        },
        coral: {
          500: "#f9735b",
          600: "#e05640"
        },
        amber: {
          500: "#f3a712"
        }
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgb(16 24 40 / 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
