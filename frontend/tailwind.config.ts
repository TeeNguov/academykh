import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        moss: "#2563eb",
        mint: "#dbeafe",
        coral: "#dc2626",
        amber: "#f59e0b",
        cloud: "#f8fafc",
        line: "#dbe3ef"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
