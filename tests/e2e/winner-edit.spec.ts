import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", "me@dev.local");
  await page.fill("#password", "test1234");
  await page.click("button[type=submit]");
  await page.waitForURL("http://localhost:3000/");
}

test.describe("winner edit (locked path)", () => {
  test("own profile shows no Edit button when tournament has started", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/user/6");

    await expect(page.getByText("TOURNAMENT WINNER")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Edit TOURNAMENT WINNER/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Edit SECRET WINNER/i }),
    ).toHaveCount(0);
  });

  test("other user's profile never shows an Edit button", async ({ page }) => {
    await login(page);
    await page.goto("/user/1");

    await expect(page.getByText("TOURNAMENT WINNER")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Edit TOURNAMENT WINNER/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Edit SECRET WINNER/i }),
    ).toHaveCount(0);
  });

  test("POST /api/user/winners rejects when tournament is locked", async ({
    page,
  }) => {
    await login(page);

    const res = await page.request.post("/api/user/winners", {
      form: { winner: "DEU", secretWinner: "ESP" },
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("picksLocked");
  });

  test("POST /api/user/winners rejects when winner === secretWinner", async ({
    page,
  }) => {
    await login(page);

    const res = await page.request.post("/api/user/winners", {
      form: { winner: "ESP", secretWinner: "ESP" },
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/user/winners requires a session", async ({ request }) => {
    const res = await request.post("/api/user/winners", {
      form: { winner: "DEU", secretWinner: "ESP" },
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("notLoggedIn");
  });
});
