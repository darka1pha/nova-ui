import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
    // userEvent-driven form and editor tests take 1–5 s each in jsdom and blow past
    // the 5 s default when the full suite shares the CPU (CI runners, laptops).
    testTimeout: 15_000,
  },
});
