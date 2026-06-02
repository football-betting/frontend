import { expect, test } from "@playwright/test";
import { login, TEST_USER } from "./helpers";

test.describe("login negatives and session", () => {
  test("a wrong password shows the generic error and stays on /login", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", "definitely-wrong");
    await page.click("button[type=submit]");

    await expect(page.getByText("Email or password incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("an unknown email shows the same generic error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", `nobody-${Date.now()}@e2e.local`);
    await page.fill("#password", "definitely-wrong");
    await page.click("button[type=submit]");

    await expect(page.getByText("Email or password incorrect.")).toBeVisible();
  });

  test("'remember me' sets a persistent session cookie", async ({
    page,
    context,
  }) => {
    await login(page, TEST_USER.email, TEST_USER.password, { remember: true });

    const cookies = await context.cookies();
    const nowSeconds = Date.now() / 1000;
    const persistent = cookies.some(
      (c) => c.expires > nowSeconds + 29 * 24 * 60 * 60,
    );
    expect(persistent).toBe(true);
  });

  test("protected pages redirect to /login when signed out", async ({
    page,
  }) => {
    for (const path of ["/", "/settings", "/ranking", "/user/1"]) {
      await page.goto(path);
      await page.waitForURL(/\/login(\?|$)/);
    }
  });
});
