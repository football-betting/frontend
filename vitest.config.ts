import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
