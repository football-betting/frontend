import { expect, test } from "@playwright/test";
import { login } from "./helpers";

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

  test("an upcoming match shows the SCHEDULED badge and a localized kickoff date", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/match/7");
    await expect(
      page.getByText("SCHEDULED", { exact: true }).first(),
    ).toBeVisible();
    // Locale is forced to English for the suite, so the long weekday renders in
    // English (formatDate uses `weekday: "long"`).
    const weekday = page.locator(
      "text=/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/",
    );
    await expect(weekday.first()).toBeVisible();
  });
});
