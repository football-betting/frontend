import { defineConfig } from "vitest/config";
import path from "node:path";

// DB-backed integration tests. A dedicated SQLite file (itest.db) is migrated
// and seeded with the demo data by the global setup before any test runs, and
// rebuilt from scratch on every run — so a previous run's writes never leak in
// (the demo seed IS the restore point). Kept separate from the fast, DB-free
// unit suite (vitest.config.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globals: false,
    globalSetup: ["tests/integration/setup.ts"],
    env: {
      DATABASE_URL: "../shared/db/itest.db",
    },
    // One shared SQLite file: run test files sequentially to avoid write
    // contention / cross-file interleaving.
    fileParallelism: false,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Separate dir so it can be merged with the unit report (./coverage)
      // rather than overwriting it.
      reportsDirectory: "./coverage-integration",
      include: ["lib/**", "app/api/**"],
    },
  },
});
