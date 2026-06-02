import { expect, test } from "@playwright/test";
import { login, TEST_USER, OTHER_USER } from "./helpers";

test.describe("profile privacy", () => {
  test("a foreign profile never exposes the user's email", async ({ page }) => {
    await login(page);
    await page.goto(`/user/${OTHER_USER.id}`);

    // The profile renders, but no email address is shown.
    await expect(page.getByText("SECRET WINNER").first()).toBeVisible();
    await expect(page.getByText(OTHER_USER.email)).toHaveCount(0);
    await expect(page.locator("text=/@local\\.dev/")).toHaveCount(0);
  });

  test("your own profile page also hides the email", async ({ page }) => {
    await login(page);
    await page.goto(`/user/${TEST_USER.id}`);

    await expect(page.getByText(TEST_USER.email)).toHaveCount(0);
  });

  test("your email is visible on your own settings page", async ({ page }) => {
    await login(page);
    await page.goto("/settings");

    await expect(page.getByText(TEST_USER.email).first()).toBeVisible();
  });
});
