import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom so React components can be rendered in the test environment
    environment: "jsdom",

    // Run the setup file before each test suite to load jest-dom matchers
    setupFiles: ["./src/test-setup.ts"],

    // Enable globals (describe, it, expect, vi) without explicit imports
    globals: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Exclude test and config files from coverage measurement
      exclude: [
        "node_modules",
        "dist",
        "**/*.config.{ts,js}",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "src/test-setup.ts",
      ],
      // PRD targets: 90% engine, 80% UI — enforce a combined floor here
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
