import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "./helpers";

// A dashboard match card (MatchRow) is the only place a tip is entered. Cards
// are scoped by the unique pair of team abbreviations they contain. View mode
// renders the score as "H : A"; edit mode renders number inputs + a SAVE button.
function upcomingCard(page: Page, home: string, away: string): Locator {
  return page
    .locator("section")
    .filter({ hasText: "UPCOMING FIXTURES" })
    .locator("div.rounded-lg.p-lg")
    .filter({ has: page.getByText(home, { exact: true }) })
    .filter({ has: page.getByText(away, { exact: true }) })
    .first();
}

async function submitScores(
  card: Locator,
  home: string,
  away: string,
): Promise<void> {
  await card.getByLabel("Home score tip").fill(home);
  const awayInput = card.getByLabel("Away score tip");
  await awayInput.fill(away);
  // Submitting via Enter avoids the duplicated mobile/desktop SAVE buttons.
  await awayInput.press("Enter");
}

test.describe("tip flow", () => {
  test("submitting a tip on an untipped upcoming match shows view mode and persists", async ({
    page,
  }) => {
    await login(page);

    // Match 8 (NED vs CRO) is upcoming and untipped for the seeded TestUser.
    const card = upcomingCard(page, "NED", "CRO");
    await expect(card.getByLabel("Home score tip")).toBeVisible();

    await submitScores(card, "2", "1");

    await expect(
      upcomingCard(page, "NED", "CRO").getByText("2 : 1"),
    ).toBeVisible();

    await page.reload();
    await expect(
      upcomingCard(page, "NED", "CRO").getByText("2 : 1"),
    ).toBeVisible();
  });

  test("an existing tip can be edited and the new value persists", async ({
    page,
  }) => {
    await login(page);

    // Match 7 (ESP vs ITA) is upcoming and seeded with TestUser's 2:0 tip.
    const card = upcomingCard(page, "ESP", "ITA");
    await expect(card.getByText("2 : 0")).toBeVisible();

    // Clicking the score enters edit mode.
    await card.getByText("2 : 0").click();
    await submitScores(card, "3", "1");

    await expect(
      upcomingCard(page, "ESP", "ITA").getByText("3 : 1"),
    ).toBeVisible();

    await page.reload();
    await expect(
      upcomingCard(page, "ESP", "ITA").getByText("3 : 1"),
    ).toBeVisible();
  });

  test("an empty score is rejected and the form stays editable", async ({
    page,
  }) => {
    await login(page);

    // Match 10 (FRA vs POL) is upcoming and untipped.
    const card = upcomingCard(page, "FRA", "POL");
    await card.getByLabel("Home score tip").fill("2");
    const away = card.getByLabel("Away score tip");
    await away.fill("");
    await away.press("Enter");

    // Required validation blocks the submit: still in edit mode, no view score.
    await expect(card.getByLabel("Home score tip")).toBeVisible();
    await expect(card.getByText(/^\d+ : \d+$/)).toHaveCount(0);
  });

  test("a live match is not tippable", async ({ page }) => {
    await login(page);

    const liveSection = page.locator("section").filter({ hasText: "LIVE NOW" });
    await expect(liveSection).toBeVisible();
    // Live matches render as plain links — no editable tip input.
    await expect(liveSection.getByLabel("Home score tip")).toHaveCount(0);
  });

  test("a FINISHED match detail page exposes no editable tip input", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/match/1");

    await expect(page.getByLabel("Home score tip")).toHaveCount(0);
  });
});
