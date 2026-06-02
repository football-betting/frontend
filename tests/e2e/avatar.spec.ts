import { expect, test } from "@playwright/test";
import { login, signupNewUser, PASSWORD, ORIGIN } from "./helpers";

// A minimal valid 1×1 PNG that `sharp` can decode on the server.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function openSettingsAsFreshUser(page: import("@playwright/test").Page) {
  const account = await signupNewUser(page, "avatar");
  await login(page, account.email, PASSWORD);
  await page.goto("/settings");
}

test.describe("avatar upload", () => {
  test("a fresh account shows the initials/icon fallback", async ({ page }) => {
    await openSettingsAsFreshUser(page);
    await expect(
      page.getByRole("button", { name: "Change photo" }).getByRole("img"),
    ).toBeVisible();
  });

  test("a valid PNG uploads successfully", async ({ page }) => {
    await openSettingsAsFreshUser(page);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/user/avatar") && r.request().method() === "POST",
    );
    await page.locator('input[type="file"]').setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: PNG_1x1,
    });
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page.getByText("Only PNG, JPG or WebP allowed.")).toHaveCount(0);
    await expect(page.getByText("File is too large (max 5 MB).")).toHaveCount(0);
  });

  test("an SVG file is rejected client-side", async ({ page }) => {
    await openSettingsAsFreshUser(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    });

    await expect(
      page.getByText("Only PNG, JPG or WebP allowed."),
    ).toBeVisible();
  });

  test("an over-sized image is rejected client-side", async ({ page }) => {
    await openSettingsAsFreshUser(page);

    await page.locator('input[type="file"]').setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(6 * 1024 * 1024, 1),
    });

    await expect(
      page.getByText("File is too large (max 5 MB)."),
    ).toBeVisible();
  });

  test("the API rejects a request with no file (400)", async ({ page }) => {
    await openSettingsAsFreshUser(page);

    const res = await page.request.post("/api/user/avatar", {
      headers: { Origin: ORIGIN },
      multipart: {},
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("noFileProvided");
  });
});
