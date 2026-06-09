import { expect, type Page } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateResetToken, hashResetToken } from "@/lib/password-reset";

// Mirrors playwright.config.ts so request-context specs can send a same-origin
// CSRF `Origin` header that matches the dynamically-chosen frontend port.
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3100);
export const ORIGIN = `http://localhost:${FRONTEND_PORT}`;

// Same shared test DB the global setup migrates + seeds (see setup.ts).
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(HERE, "../..");
const TEST_DB = path.resolve(FRONTEND_ROOT, "../shared/db/test.db");

/**
 * Issue a valid password-reset token for a user straight into the DB and return
 * the raw token. The raw token only ever lives in the email, so an E2E that
 * drives /reset-password seeds it the same way the route would: store the hash,
 * hand the caller the raw value. Mirrors lib/password-reset-store.
 */
export function seedResetToken(email: string): string {
  const db = new Database(TEST_DB);
  try {
    const row = db
      .prepare("SELECT id FROM user WHERE email = ?")
      .get(email) as { id: number } | undefined;
    if (!row) {
      throw new Error(`seedResetToken: no user for ${email}`);
    }
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    // expires_at is a Drizzle `timestamp` column → stored as unix seconds.
    const expiresAt = Math.floor((Date.now() + 60 * 60 * 1000) / 1000);
    db.prepare(
      "INSERT INTO password_reset_token (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    ).run(row.id, tokenHash, expiresAt);
    return token;
  } finally {
    db.close();
  }
}

// Canonical seeded accounts (see frontend/scripts/demo_data.ts). Every seeded
// user shares the password below. TEST_USER is id 6 and is the account most
// "own profile" specs assert against (/user/6); OTHER_USER (id 1) is used for
// foreign-profile assertions.
export const PASSWORD = "test1234";

export const TEST_USER = {
  id: 6,
  email: "test.user@local.dev",
  username: "TestUser",
  password: PASSWORD,
} as const;

export const OTHER_USER = {
  id: 1,
  email: "ada.lovelace@local.dev",
  username: "AdaLovelace",
  password: PASSWORD,
} as const;

interface LoginOptions {
  remember?: boolean;
}

/** Log in via the real form and wait until the dashboard (`/`) is reached. */
export async function login(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password,
  options: LoginOptions = {},
): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  if (options.remember) {
    await page.check("#remember");
  }
  await page.click("button[type=submit]");
  await page.waitForURL((url) => url.pathname === "/");
}

export async function logout(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Logout" })
    .first()
    .click();
  await page.waitForURL(/\/login(\?|$)/);
}

export async function expectOnDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === "/");
}

export interface SignupFields {
  username: string;
  email: string;
  password?: string;
  rePassword?: string;
  department?: string;
  winner?: string;
  secretWinner?: string;
}

/** Fill the signup form. Does not submit. */
export async function fillSignupForm(
  page: Page,
  fields: SignupFields,
): Promise<void> {
  await page.goto("/signup");
  await page.fill("#username", fields.username);
  await page.fill("#email", fields.email);
  await page.fill("#password", fields.password ?? PASSWORD);
  await page.fill("#rePassword", fields.rePassword ?? fields.password ?? PASSWORD);
  await page.selectOption("#department", fields.department ?? "Langenfeld");
  await page.selectOption("#winner", fields.winner ?? "GER");
  await page.selectOption("#secretWinner", fields.secretWinner ?? "ESP");
}

/**
 * Register a brand-new account and return its credentials. The globalSetup
 * wipes test.db before every run, so a `prefix`-based unique email is stable
 * within a run and never clashes across runs.
 */
export async function signupNewUser(
  page: Page,
  prefix: string,
): Promise<{ email: string; username: string; password: string }> {
  const stamp = `${prefix}-${Date.now()}`;
  const email = `${stamp}@e2e.local`;
  const username = stamp.replace(/[^a-zA-Z0-9]/g, "");
  await fillSignupForm(page, { username, email });
  await page.click("button[type=submit]");
  await page.waitForURL(/\/login\?registered=true$/);
  return { email, username, password: PASSWORD };
}
