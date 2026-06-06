import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Pure-function tests — no React render, no jsdom needed.
    environment: "node",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
