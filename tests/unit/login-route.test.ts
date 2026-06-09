import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(async () => true),
}));
vi.mock("oslo/password", () => ({
  Argon2id: class {
    verify = verifyMock;
  },
}));

const cookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: cookieSet })),
}));

vi.mock("@/lib/auth", () => ({
  lucia: { createSession: vi.fn(), createSessionCookie: vi.fn() },
  REMEMBER_COOKIE: "remember_me",
  REMEMBER_MAX_AGE_SECONDS: 2592000,
}));
vi.mock("@/lib/user", () => ({ getUserByEmail: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { lucia } from "@/lib/auth";
import { getUserByEmail } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/auth/login/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function loginReq(
  fields: Record<string, string>,
  accept?: string,
): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  const headers: Record<string, string> = {};
  if (accept) headers.accept = accept;
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers,
    body: fd,
  });
}

const CREDS = { email: "u@valantic.com", password: "longpassword1" };

beforeEach(() => {
  vi.clearAllMocks();
  verifyMock.mockResolvedValue(true);
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(getUserByEmail).mockResolvedValue({
    id: 21,
    password: "stored-hash",
  } as unknown as Awaited2<typeof getUserByEmail>);
  vi.mocked(lucia.createSession).mockResolvedValue({
    id: "sess-1",
  } as unknown as Awaited2<typeof lucia.createSession>);
  vi.mocked(lucia.createSessionCookie).mockReturnValue({
    name: "auth_session",
    value: "cookie-val",
    attributes: { maxAge: 999, expires: new Date(), path: "/" },
  } as unknown as ReturnType<typeof lucia.createSessionCookie>);
});

describe("login route", () => {
  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 8 });
    const res = await POST(loginReq(CREDS));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("8");
  });

  it("returns 400 with the first zod message on invalid input", async () => {
    const res = await POST(loginReq({ email: "bad", password: "short" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidEmail" });
  });

  it("returns generic loginError for an unknown email (verifies dummy hash)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(
      undefined as unknown as Awaited2<typeof getUserByEmail>,
    );
    const res = await POST(loginReq(CREDS));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "loginError" });
    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(lucia.createSession).not.toHaveBeenCalled();
  });

  it("returns generic loginError on a wrong password", async () => {
    verifyMock.mockResolvedValue(false);
    const res = await POST(loginReq(CREDS));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "loginError" });
    expect(lucia.createSession).not.toHaveBeenCalled();
  });

  it("logs in with remember and sets a persistent cookie + remember flag (302)", async () => {
    const res = await POST(loginReq({ ...CREDS, remember: "on" }));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
    expect(lucia.createSession).toHaveBeenCalledWith("21", {});
    expect(cookieSet).toHaveBeenCalledWith(
      "auth_session",
      "cookie-val",
      expect.objectContaining({ maxAge: 999 }),
    );
    expect(cookieSet).toHaveBeenCalledWith(
      "remember_me",
      "1",
      expect.objectContaining({ maxAge: 2592000 }),
    );
  });

  it("logs in without remember: session-scoped cookie, no maxAge", async () => {
    const res = await POST(loginReq(CREDS));
    expect(res.status).toBe(302);
    const sessionCall = cookieSet.mock.calls.find((c) => c[0] === "auth_session");
    const attrs = sessionCall?.[2] as Record<string, unknown>;
    expect(attrs).not.toHaveProperty("maxAge");
    expect(attrs).not.toHaveProperty("expires");
    expect(cookieSet).toHaveBeenCalledWith(
      "remember_me",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("returns 200 JSON when the client accepts application/json", async () => {
    const res = await POST(loginReq(CREDS, "application/json"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
