import { expect, test } from "@playwright/test";

test.describe("auth happy path", () => {
  test("signup redirects to /login?registered=true and shows success banner", async ({
    page,
  }) => {
    const unique = `e2e-signup-${Date.now()}@dev.local`;
    await page.goto("/signup");

    await page.fill("#username", `e2e_${Date.now()}`);
    await page.fill("#email", unique);
    await page.fill("#password", "test1234");
    await page.fill("#rePassword", "test1234");
    await page.selectOption("#department", "Langenfeld");
    await page.selectOption("#winner", "DEU");
    await page.selectOption("#secretWinner", "ESP");

    await page.click("button[type=submit]");

    await page.waitForURL(/\/login\?registered=true$/);
    await expect(
      page.getByText("Account created. Sign in below."),
    ).toBeVisible();
  });

  test("login lands on the dashboard, logout returns to /login, /  redirects to /login when signed out", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#email", "test.user@local.dev");
    await page.fill("#password", "test1234");
    await page.click("button[type=submit]");
    await page.waitForURL((url) => url.pathname === "/");

    await expect(page).toHaveURL((url) => url.pathname === "/");

    const logout = page.getByRole("button", { name: "Logout" }).first();
    await logout.click();
    await page.waitForURL(/\/login(\?|$)/);

    await page.goto("/");
    await page.waitForURL(/\/login(\?|$)/);
  });
});
