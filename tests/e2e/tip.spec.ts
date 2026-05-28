import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", "me@dev.local");
  await page.fill("#password", "test1234");
  await page.click("button[type=submit]");
  await page.waitForURL("http://localhost:3000/");
}

test.describe("tip flow", () => {
  test("entering a tip for a SCHEDULED match persists across reload", async ({
    page,
  }) => {
    await login(page);

    const homeInput = page.getByLabel("Home score tip").first();
    const awayInput = page.getByLabel("Away score tip").first();
    await expect(homeInput).toBeVisible();

    await homeInput.fill("2");
    await awayInput.fill("1");

    const form = homeInput.locator("xpath=ancestor::form");
    await form.getByRole("button").click();

    await expect(form.getByRole("button")).toHaveText(/SAVED|EDIT/, {
      timeout: 10_000,
    });

    await page.reload();
    const homeAfter = page.getByLabel("Home score tip").first();
    const awayAfter = page.getByLabel("Away score tip").first();
    await expect(homeAfter).toHaveValue("2");
    await expect(awayAfter).toHaveValue("1");
  });

  test("a FINISHED match exposes no editable tip input", async ({ page }) => {
    await login(page);
    await page.goto("/match/1");

    const tipInputs = page.getByLabel("Home score tip");
    await expect(tipInputs).toHaveCount(0);
  });
});
