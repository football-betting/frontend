import { defineConfig, devices } from "@playwright/test";

// Dedicated ports for the isolated E2E stand so the suite never collides with a
// developer's running dev stack (frontend :3000 / betting-api :8080 on the
// shared DB). Everything here runs against ../shared/db/test.db only.
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3100);
const RUST_PORT = Number(process.env.E2E_RUST_PORT ?? 8090);
const BASE_URL = `http://localhost:${FRONTEND_PORT}`;
const RUST_API_URL = `http://localhost:${RUST_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // Force English UI deterministically (app default locale is German). The
    // i18n spec clears this cookie itself to exercise switching/persistence.
    storageState: {
      cookies: [
        {
          name: "locale",
          value: "en",
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // Read API on test.db, dedicated port. betting-api honours BIND_ADDR.
      command: "cargo run --quiet",
      cwd: "../betting-api",
      url: `${RUST_API_URL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        BIND_ADDR: `127.0.0.1:${RUST_PORT}`,
        MODE: "production",
        DATABASE_URL: "../shared/db/test.db",
      },
    },
    {
      command: `pnpm dev --port ${FRONTEND_PORT}`,
      url: `${BASE_URL}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: "../shared/db/test.db",
        RUST_API_URL,
        DISABLE_RATE_LIMIT: "1",
        // Own build dir so this server doesn't clash with a running `next dev`.
        NEXT_DIST_DIR: ".next-e2e",
      },
    },
  ],
});
