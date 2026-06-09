import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/user", () => ({ getUserByEmail: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));
vi.mock("@/lib/password-reset", () => ({
  generateResetToken: vi.fn(() => "reset-token"),
  hashResetToken: vi.fn(() => "token-hash"),
  resetTokenExpiry: vi.fn(() => new Date(1700000000000)),
}));
vi.mock("@/lib/password-reset-store", () => ({
  createPasswordResetToken: vi.fn(),
}));
vi.mock("@/lib/mail", () => ({ sendPasswordResetEmail: vi.fn() }));
vi.mock("@/lib/app-origin", () => ({ resolveAppOrigin: vi.fn() }));

import { getUserByEmail } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createPasswordResetToken } from "@/lib/password-reset-store";
import { sendPasswordResetEmail } from "@/lib/mail";
import { resolveAppOrigin } from "@/lib/app-origin";
import { GET, POST } from "@/app/api/auth/forgot-password/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): NextRequest {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

// Let the fire-and-forget issueReset() promise chain settle.
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(resolveAppOrigin).mockReturnValue("https://app.test");
  vi.mocked(getUserByEmail).mockResolvedValue({
    id: 5,
    email: "u@valantic.com",
  } as unknown as Awaited2<typeof getUserByEmail>);
  vi.mocked(createPasswordResetToken).mockResolvedValue(
    undefined as unknown as Awaited2<typeof createPasswordResetToken>,
  );
  vi.mocked(sendPasswordResetEmail).mockResolvedValue(
    undefined as unknown as Awaited2<typeof sendPasswordResetEmail>,
  );
});

describe("forgot-password route", () => {
  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 12 });
    const res = await POST(jsonReq({ email: "u@valantic.com" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("12");
  });

  it("returns generic ok and never enqueues for an unknown email (no enumeration)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(
      undefined as unknown as Awaited2<typeof getUserByEmail>,
    );
    const res = await POST(jsonReq({ email: "ghost@valantic.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await flush();
    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns generic ok on invalid email without doing a lookup", async () => {
    const res = await POST(jsonReq({ email: "not-an-email" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(getUserByEmail).not.toHaveBeenCalled();
  });

  it("returns generic ok when the body cannot be read", async () => {
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad",
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("enqueues a reset token + email for a known user", async () => {
    const res = await POST(jsonReq({ email: "u@valantic.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await flush();
    expect(createPasswordResetToken).toHaveBeenCalledWith(
      5,
      "token-hash",
      new Date(1700000000000),
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "u@valantic.com",
      "https://app.test/reset-password?token=reset-token",
    );
  });

  it("skips the email when the app origin is unresolved (null)", async () => {
    vi.mocked(resolveAppOrigin).mockReturnValue(null);
    const res = await POST(jsonReq({ email: "u@valantic.com" }));
    expect(res.status).toBe(200);
    await flush();
    expect(createPasswordResetToken).toHaveBeenCalledTimes(1);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
