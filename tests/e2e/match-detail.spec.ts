import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", "me@dev.local");
  await page.fill("#password", "test1234");
  await page.click("button[type=submit]");
  await page.waitForURL("http://localhost:3000/");
}

test.describe("match detail status badges", () => {
  test("FINISHED match shows the FULL TIME badge", async ({ page }) => {
    await login(page);
    await page.goto("/match/1");
    await expect(
      page.getByText("FULL TIME", { exact: true }).first(),
    ).toBeVisible();
  });

  test("IN_PLAY match shows the LIVE badge", async ({ page }) => {
    await login(page);
    await page.goto("/match/5");
    await expect(page.getByText("LIVE", { exact: true }).first()).toBeVisible();
  });

  test("SCHEDULED match shows the SCHEDULED badge and the German kickoff date", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/match/7");
    await expect(
      page.getByText("SCHEDULED", { exact: true }).first(),
    ).toBeVisible();
    const germanWeekday = page.locator("text=/Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/");
    await expect(germanWeekday.first()).toBeVisible();
  });
});
