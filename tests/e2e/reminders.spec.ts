import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

const emailToggle = (page: Page) =>
  page.getByRole("checkbox", { name: "Email reminders" });

const oneHourLead = (page: Page) =>
  page.getByRole("checkbox", { name: "1 hour before" });

test.describe("email reminders", () => {
  test("lead-time selection persists; disabling channels locks the controls", async ({
    page,
  }) => {
    await login(page); // TEST_USER — email reminders are on by default (FE-073)
    await page.goto("/settings");

    await expect(emailToggle(page)).toBeChecked();
    // Email on => at least one channel active => lead-time controls usable.
    await expect(oneHourLead(page)).toBeEnabled();

    await oneHourLead(page).check();
    await page.getByRole("button", { name: "Save reminders" }).click();
    await expect(page.getByText("Reminders saved.")).toBeVisible();

    // Persists across a reload.
    await page.goto("/settings");
    await expect(oneHourLead(page)).toBeChecked();
    await expect(emailToggle(page)).toBeChecked();

    // Turning the email channel off (push is off) locks the lead-time controls.
    // The toggle persists via a fetch then flips state, so click + assert the
    // resulting state rather than uncheck() (which checks the state eagerly).
    await emailToggle(page).click();
    await expect(emailToggle(page)).not.toBeChecked();
    await expect(
      page.getByText("Enable email or push to receive reminders."),
    ).toBeVisible();
    await expect(oneHourLead(page)).toBeDisabled();

    // Leave the shared seeded user back in its default (email on) state.
    await emailToggle(page).click();
    await expect(emailToggle(page)).toBeChecked();
    await expect(oneHourLead(page)).toBeEnabled();
  });
});
