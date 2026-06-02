import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(1);
}

test.describe("mobile smoke", () => {
  test("the login page fits the viewport", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("the main authenticated pages fit the viewport", async ({ page }) => {
    await login(page);

    const pages: Array<{ path: string; expect: () => Promise<void> }> = [
      {
        path: "/",
        expect: async () =>
          expect(page.getByText("UPCOMING FIXTURES")).toBeVisible(),
      },
      {
        path: "/ranking",
        expect: async () =>
          expect(
            page.getByRole("button", { name: "Global", exact: true }),
          ).toBeVisible(),
      },
      {
        path: "/user/6",
        expect: async () =>
          expect(page.getByText("SECRET WINNER").first()).toBeVisible(),
      },
      {
        path: "/match/1",
        expect: async () =>
          expect(page.getByText("FULL TIME").first()).toBeVisible(),
      },
      {
        path: "/settings",
        expect: async () =>
          expect(page.getByText("Profile Settings").first()).toBeVisible(),
      },
      {
        path: "/features",
        expect: async () => expect(page.locator("h1").first()).toBeVisible(),
      },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await p.expect();
      await expectNoHorizontalScroll(page);
    }
  });

  test("logout works from the mobile settings header", async ({ page }) => {
    await login(page);
    await page.goto("/settings");

    // BottomNav has no logout; the mobile settings header carries it. The page
    // also has a desktop-only logout button (hidden here), so pick the visible.
    await page
      .locator('form[action="/api/auth/logout"] button')
      .filter({ visible: true })
      .first()
      .click();
    await page.waitForURL(/\/login(\?|$)/);
  });
});
