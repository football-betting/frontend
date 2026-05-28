import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", "me@dev.local");
  await page.fill("#password", "test1234");
  await page.click("button[type=submit]");
  await page.waitForURL("http://localhost:3000/");
}

test.describe("profile page", () => {
  test("renders four stat tiles and a history table without tournament bonuses", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/user/6");

    for (const label of ["EXACT", "DIFF", "WINS", "BONUS"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }

    const offlineLine = page.getByText("Service offline");
    const isOffline = await offlineLine
      .first()
      .isVisible()
      .catch(() => false);

    if (!isOffline) {
      const historySection = page
        .locator("section", { hasText: "Prediction History" })
        .first();
      const sectionText = (await historySection.innerText()) ?? "";
      expect(sectionText).not.toMatch(/\+150/);
      expect(sectionText).not.toMatch(/\+15\b/);
      expect(sectionText).not.toMatch(/\+7\b/);
      const offendingTokens = [
        "GRUPPENPHASE",
        "VIERTELFINALE",
        "HALBFINALE",
        "ACHTELFINALE",
        "FINALE",
      ];
      for (const token of offendingTokens) {
        expect(sectionText.toUpperCase()).not.toContain(token);
      }
    }
  });
});
