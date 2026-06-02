import { expect, test } from "@playwright/test";
import { login, logout, signupNewUser, PASSWORD } from "./helpers";

// Each test registers its own throwaway account so changing a password never
// disturbs the seeded users other specs rely on.
test.describe("password change", () => {
  test("changing the password succeeds and the new password works", async ({
    page,
  }) => {
    const account = await signupNewUser(page, "pwok");
    await login(page, account.email, PASSWORD);

    await page.goto("/settings");
    await page.fill("#currentPassword", PASSWORD);
    await page.fill("#newPassword", "brandnew-123");
    await page.fill("#confirmPassword", "brandnew-123");
    await page.getByRole("button", { name: "Update Password" }).click();

    await expect(
      page.getByText("Password updated successfully."),
    ).toBeVisible();

    await logout(page);
    await login(page, account.email, "brandnew-123");
    await expect(page).toHaveURL((url) => url.pathname === "/");
  });

  test("a wrong current password is rejected by the server", async ({
    page,
  }) => {
    const account = await signupNewUser(page, "pwwrong");
    await login(page, account.email, PASSWORD);

    await page.goto("/settings");
    await page.fill("#currentPassword", "not-my-password");
    await page.fill("#newPassword", "brandnew-123");
    await page.fill("#confirmPassword", "brandnew-123");
    await page.getByRole("button", { name: "Update Password" }).click();

    await expect(
      page.getByText("Current password is incorrect."),
    ).toBeVisible();
  });

  test("a too-short new password is rejected client-side", async ({ page }) => {
    const account = await signupNewUser(page, "pwshort");
    await login(page, account.email, PASSWORD);

    await page.goto("/settings");
    await page.fill("#currentPassword", PASSWORD);
    await page.fill("#newPassword", "short");
    await page.fill("#confirmPassword", "short");
    await page.getByRole("button", { name: "Update Password" }).click();

    await expect(
      page.getByText("New password must be at least 8 characters."),
    ).toBeVisible();
  });

  test("mismatched new passwords are rejected client-side", async ({
    page,
  }) => {
    const account = await signupNewUser(page, "pwmismatch");
    await login(page, account.email, PASSWORD);

    await page.goto("/settings");
    await page.fill("#currentPassword", PASSWORD);
    await page.fill("#newPassword", "brandnew-123");
    await page.fill("#confirmPassword", "brandnew-999");
    await page.getByRole("button", { name: "Update Password" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });
});
