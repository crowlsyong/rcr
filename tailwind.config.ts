import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xxs: ["0.625rem", { lineHeight: "0.875rem" }], // 10px font, 14px line height
      },
    },
  },
} satisfies Config;
