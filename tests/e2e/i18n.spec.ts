import { expect, test } from "@playwright/test";

// The suite forces locale=en globally (see playwright.config.ts). These tests
// clear that cookie to exercise the real default + the switcher persistence.
test.describe("i18n language switcher", () => {
  test("defaults to German and the language menu switches to English", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto("/login");
    // Default locale is German → the submit button reads "Anmelden".
    await expect(
      page.getByRole("button", { name: "Anmelden" }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Language" }).selectOption("en");

    // Now English → "Sign In".
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("the chosen locale persists across reloads", async ({
    page,
    context,
  }) => {
    await context.clearCookies();

    await page.goto("/login");
    await page.getByRole("combobox", { name: "Language" }).selectOption("en");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Anmelden" }),
    ).toHaveCount(0);
  });
});
