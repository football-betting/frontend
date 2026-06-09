import { expect, test } from "@playwright/test";
import { fillSignupForm, PASSWORD } from "./helpers";

// Positive signup is covered in auth-flow.spec.ts; this file focuses on the
// negative/validation cases.
test.describe("signup validation", () => {
  test("rejects mismatched passwords", async ({ page }) => {
    await fillSignupForm(page, {
      username: `mismatch_${Date.now()}`,
      email: `mismatch-${Date.now()}@e2e.local`,
      password: PASSWORD,
      rePassword: "different-9",
    });
    await page.click("button[type=submit]");

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await fillSignupForm(page, {
      username: `short_${Date.now()}`,
      email: `short-${Date.now()}@e2e.local`,
      password: "short",
      rePassword: "short",
    });
    await page.click("button[type=submit]");

    await expect(page.getByText("Invalid password")).toBeVisible();
  });

  test("rejects identical tournament winner and secret winner", async ({
    page,
  }) => {
    await fillSignupForm(page, {
      username: `samewinner_${Date.now()}`,
      email: `samewinner-${Date.now()}@e2e.local`,
      winner: "GER",
      secretWinner: "GER",
    });
    await page.click("button[type=submit]");

    await expect(
      page.getByText("Winner and secret winner must differ."),
    ).toBeVisible();
  });

  test("rejects a username that is already taken (409)", async ({ page }) => {
    // "TestUser" is a seeded username.
    await fillSignupForm(page, {
      username: "TestUser",
      email: `fresh-${Date.now()}@e2e.local`,
    });
    await page.click("button[type=submit]");

    await expect(
      page.getByText("This username is already taken."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("rejects an email that is already registered", async ({ page }) => {
    await fillSignupForm(page, {
      username: `dupemail_${Date.now()}`,
      email: "test.user@local.dev",
    });
    await page.click("button[type=submit]");

    await expect(
      page.getByText("This email is already registered."),
    ).toBeVisible();
  });

  test("shows the username-is-not-email and valantic-domain hints", async ({
    page,
  }) => {
    await page.goto("/signup");
    await expect(
      page.getByText("This is not your email address."),
    ).toBeVisible();
    await expect(
      page.getByText("Only valantic.com email addresses are allowed."),
    ).toBeVisible();
  });

  // The valantic.com domain restriction is only enforced when NODE_ENV is
  // "production"; the dev/test stand intentionally accepts any domain so the
  // other flows can run. Verified by unit tests on isAllowedSignupEmailDomain.
  test("rejects a non-valantic email (production only)", async ({ page }) => {
    test.skip(
      process.env.NODE_ENV !== "production",
      "domain restriction is production-only",
    );
    await fillSignupForm(page, {
      username: `outsider_${Date.now()}`,
      email: `outsider-${Date.now()}@gmail.com`,
    });
    await page.click("button[type=submit]");
    await expect(
      page.getByText("Only valantic.com email addresses are allowed."),
    ).toBeVisible();
  });
});
