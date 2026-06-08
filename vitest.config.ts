import { coverageConfigDefaults, defineConfig } from "vitest/config";
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
      exclude: [
        ...coverageConfigDefaults.exclude,
        // Genuinely not unit-testable: declarative Drizzle schema + SQL
        // migrations, operational scripts (migrate/seed/reset), the service
        // worker + PWA manifest, and the RSC app-shell layouts. Logic-bearing
        // code (lib, components, api routes) stays in scope.
        "db/schema.ts",
        "db/migrations/**",
        "scripts/**",
        "app/sw.ts",
        "app/manifest.ts",
        "app/**/layout.tsx",
        // Lucia auth/session glue: cookie + adapter integration, exercised by
        // the login E2E flow, not unit-testable without mocking next/headers.
        "lib/auth.ts",
        "lib/session.ts",
      ],
    },
  },
});
