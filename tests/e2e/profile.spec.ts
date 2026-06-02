import { expect, test } from "@playwright/test";
import { login } from "./helpers";

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

  test("secretWinner is public on every profile", async ({ page }) => {
    await login(page);

    // Own profile (user 6 = TestUser, secretWinner = NLD per FE-007 seed)
    await page.goto("/user/6");
    const ownSecretCard = page
      .locator("div", { hasText: "SECRET WINNER" })
      .first();
    await expect(ownSecretCard).toBeVisible();
    await expect(ownSecretCard).toContainText("NLD");

    // Another user's profile (user 1 = AdaLovelace, secretWinner = ESP per FE-007 seed)
    await page.goto("/user/1");
    const otherSecretCard = page
      .locator("div", { hasText: "SECRET WINNER" })
      .first();
    await expect(otherSecretCard).toBeVisible();
    await expect(otherSecretCard).toContainText("ESP");

    // Tournament Winner is also public — AdaLovelace.winner = DEU
    await expect(page.locator("body")).toContainText("TOURNAMENT WINNER");
    await expect(page.locator("body")).toContainText("DEU");
  });
});
