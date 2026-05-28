import { expect, test, type APIResponse } from "@playwright/test";

async function attemptLogin(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string,
): Promise<{ status: number; body: { error?: string } }> {
  const form = new URLSearchParams();
  form.set("email", email);
  form.set("password", password);
  const res: APIResponse = await request.post(
    "http://localhost:3000/api/auth/login",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Origin: "http://localhost:3000",
      },
      data: form.toString(),
    },
  );
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return { status: res.status(), body };
}

test.describe("auth disclosure", () => {
  test("unknown email and wrong password produce the same response as a known email with a wrong password", async ({
    request,
  }) => {
    const unknown = await attemptLogin(
      request,
      `unknown-${Date.now()}@dev.local`,
      "wrong-password-99",
    );
    const known = await attemptLogin(
      request,
      "me@dev.local",
      "wrong-password-99",
    );

    expect(unknown.status).toBe(known.status);
    expect(unknown.body.error).toBe(known.body.error);
    expect(known.body.error).toBe("Email or password incorrect.");
  });
});
