import { expect, type Page } from "@playwright/test";

// Mirrors playwright.config.ts so request-context specs can send a same-origin
// CSRF `Origin` header that matches the dynamically-chosen frontend port.
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3100);
export const ORIGIN = `http://localhost:${FRONTEND_PORT}`;

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
  await page.selectOption("#winner", fields.winner ?? "DEU");
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
