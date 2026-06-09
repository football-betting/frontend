import { expect, test } from "@playwright/test";
import { login, logout, signupNewUser, seedResetToken, PASSWORD } from "./helpers";

test.describe("password reset", () => {
  test("forgot-password shows the generic confirmation", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.fill("#email", "whoever@e2e.local");
    await page.click("button[type=submit]");

    // Generic message regardless of whether the email exists (no enumeration).
    await expect(
      page.getByText("If that email is registered, we have sent a reset link."),
    ).toBeVisible();
  });

  test("a reset token sets a new password; old password stops working", async ({
    page,
  }) => {
    const account = await signupNewUser(page, "reset");
    const token = seedResetToken(account.email);
    const newPassword = "newpass-9876";

    await page.goto(`/reset-password?token=${token}`);
    await page.fill("#newPassword", newPassword);
    await page.fill("#confirmPassword", newPassword);
    await page.click("button[type=submit]");
    await expect(
      page.getByText("Your password has been updated. You can now sign in."),
    ).toBeVisible();

    // The new password signs in (login() waits for the dashboard).
    await login(page, account.email, newPassword);
    await logout(page);

    // The old password is now rejected — stays on /login.
    await page.goto("/login");
    await page.fill("#email", account.email);
    await page.fill("#password", PASSWORD);
    await page.click("button[type=submit]");
    await expect(page.getByText("Email or password incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("an invalid reset token is rejected", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await page.fill("#newPassword", "whatever-9999");
    await page.fill("#confirmPassword", "whatever-9999");
    await page.click("button[type=submit]");

    // No success message — the form surfaces an error and stays put.
    await expect(
      page.getByText("Your password has been updated. You can now sign in."),
    ).toHaveCount(0);
  });
});
