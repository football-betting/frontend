import { beforeEach, describe, expect, it, vi } from "vitest";

const { hashMock, verifyMock } = vi.hoisted(() => ({
  hashMock: vi.fn(async () => "new-hash"),
  verifyMock: vi.fn(async () => true),
}));
vi.mock("oslo/password", () => ({
  Argon2id: class {
    hash = hashMock;
    verify = verifyMock;
  },
}));

const cookieGet = vi.fn(() => ({ value: "1" }));
const cookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet, set: cookieSet })),
}));

vi.mock("@/lib/auth", () => ({
  lucia: {
    invalidateUserSessions: vi.fn(),
    createSession: vi.fn(),
    createSessionCookie: vi.fn(),
  },
  REMEMBER_COOKIE: "remember_me",
}));
vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/user", () => ({
  getUserById: vi.fn(),
  updateUserPassword: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { lucia } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session";
import { getUserById, updateUserPassword } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { GET, POST } from "@/app/api/user/password/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/user/password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = {
  currentPassword: "oldpassword",
  newPassword: "newpassword1",
  confirmPassword: "newpassword1",
};

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("new-hash");
  verifyMock.mockResolvedValue(true);
  cookieGet.mockReturnValue({ value: "1" });
  loggedIn("3");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(getUserById).mockResolvedValue({
    id: 3,
    password: "stored-hash",
  } as unknown as Awaited2<typeof getUserById>);
  vi.mocked(updateUserPassword).mockResolvedValue(
    undefined as unknown as Awaited2<typeof updateUserPassword>,
  );
  vi.mocked(lucia.invalidateUserSessions).mockResolvedValue(undefined as never);
  vi.mocked(lucia.createSession).mockResolvedValue({
    id: "sess-1",
  } as unknown as Awaited2<typeof lucia.createSession>);
  vi.mocked(lucia.createSessionCookie).mockReturnValue({
    name: "auth_session",
    value: "cookie-val",
    attributes: { maxAge: 999, expires: new Date(), path: "/" },
  } as unknown as ReturnType<typeof lucia.createSessionCookie>);
});

describe("user/password route", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 5 });
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5");
  });

  it("returns 400 invalidRequestBody on unparseable JSON", async () => {
    const req = new Request("http://localhost/api/user/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 with the first zod message on invalid input", async () => {
    const res = await POST(
      jsonReq({ currentPassword: "x", newPassword: "short", confirmPassword: "short" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "newPasswordTooShort" });
  });

  it("returns 401 when the session user no longer exists", async () => {
    vi.mocked(getUserById).mockResolvedValue(
      undefined as unknown as Awaited2<typeof getUserById>,
    );
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 400 currentPasswordIncorrect when the current password is wrong", async () => {
    verifyMock.mockResolvedValue(false);
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "currentPasswordIncorrect" });
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("updates password, rotates session, sets cookie, returns 200", async () => {
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith(3, "new-hash");
    expect(lucia.invalidateUserSessions).toHaveBeenCalledWith("3");
    expect(lucia.createSession).toHaveBeenCalledWith("3", {});
    expect(cookieSet).toHaveBeenCalledWith(
      "auth_session",
      "cookie-val",
      expect.objectContaining({ maxAge: 999 }),
    );
  });

  it("strips maxAge/expires when the session is not remembered", async () => {
    cookieGet.mockReturnValue({ value: "0" });
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(200);
    const attrs = cookieSet.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(attrs).not.toHaveProperty("maxAge");
    expect(attrs).not.toHaveProperty("expires");
  });

  it("returns 500 failedToUpdatePassword when the update throws", async () => {
    vi.mocked(updateUserPassword).mockRejectedValue(new Error("db"));
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdatePassword" });
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
