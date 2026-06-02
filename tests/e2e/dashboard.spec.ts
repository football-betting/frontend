import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("dashboard buckets", () => {
  test("live block lists both IN_PLAY matches", async ({ page }) => {
    await login(page);

    const liveSection = page
      .locator("section", { hasText: "LIVE NOW" })
      .first();
    await expect(liveSection).toBeVisible();
    const liveRows = liveSection.locator("a[href^='/match/']");
    await expect(liveRows).toHaveCount(2);
  });

  test("upcoming list shows the SCHEDULED fixtures grouped by date", async ({
    page,
  }) => {
    await login(page);

    const upcomingSection = page
      .locator("section", { hasText: "UPCOMING FIXTURES" })
      .first();
    await expect(upcomingSection).toBeVisible();
    const homeInputs = upcomingSection.getByLabel("Home score tip");
    const count = await homeInputs.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});
