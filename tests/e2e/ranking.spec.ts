import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", "me@dev.local");
  await page.fill("#password", "test1234");
  await page.click("button[type=submit]");
  await page.waitForURL("http://localhost:3000/");
}

test.describe("ranking page", () => {
  test("renders the four tabs and the scoring legend", async ({ page }) => {
    await login(page);
    await page.goto("/ranking");

    for (const tab of ["Global", "Langenfeld", "Mannheim", "Mainz"]) {
      await expect(
        page.getByRole("button", { name: tab, exact: true }),
      ).toBeVisible();
    }

    const offlineNotice = page.getByText("Ranking API offline");
    const scoringInfobox = page.getByText("Scoring System");

    const ranking = await scoringInfobox
      .first()
      .isVisible()
      .catch(() => false);
    const offline = await offlineNotice
      .first()
      .isVisible()
      .catch(() => false);

    expect(ranking || offline).toBe(true);

    if (ranking) {
      await expect(page.getByText("5 Pts")).toBeVisible();
      await expect(page.getByText("3 Pts")).toBeVisible();
      await expect(page.getByText("2 Pts").first()).toBeVisible();
      await expect(page.getByText("+12 Pts (bonus)")).toBeVisible();
      await expect(page.getByText("+6 Pts (bonus)")).toBeVisible();
      const youPill = page.getByText("YOU", { exact: true }).first();
      await expect(youPill).toBeVisible();
    }
  });
});
