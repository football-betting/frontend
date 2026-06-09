import { beforeEach, describe, expect, it, vi } from "vitest";

const { hashMock } = vi.hoisted(() => ({
  hashMock: vi.fn(async () => "argon-hash"),
}));
vi.mock("oslo/password", () => ({
  Argon2id: class {
    hash = hashMock;
  },
}));
vi.mock("@/lib/auth", () => ({
  lucia: { invalidateUserSessions: vi.fn() },
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));
vi.mock("@/lib/user", () => ({ updateUserPassword: vi.fn() }));
vi.mock("@/lib/password-reset", () => ({
  hashResetToken: vi.fn((t: string) => `hashed:${t}`),
  isResetTokenExpired: vi.fn(() => false),
}));
vi.mock("@/lib/password-reset-store", () => ({
  deletePasswordResetTokensForUser: vi.fn(),
  findPasswordResetTokenByHash: vi.fn(),
}));

import { lucia } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { updateUserPassword } from "@/lib/user";
import { isResetTokenExpired } from "@/lib/password-reset";
import {
  deletePasswordResetTokensForUser,
  findPasswordResetTokenByHash,
} from "@/lib/password-reset-store";
import { GET, POST } from "@/app/api/auth/reset-password/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = {
  token: "tok",
  newPassword: "longenough1",
  confirmPassword: "longenough1",
};

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("argon-hash");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(isResetTokenExpired).mockReturnValue(false);
  vi.mocked(findPasswordResetTokenByHash).mockResolvedValue({
    userId: 42,
    tokenHash: "hashed:tok",
    expiresAt: new Date(Date.now() + 60000),
  } as unknown as Awaited2<typeof findPasswordResetTokenByHash>);
  vi.mocked(updateUserPassword).mockResolvedValue(
    undefined as unknown as Awaited2<typeof updateUserPassword>,
  );
  vi.mocked(lucia.invalidateUserSessions).mockResolvedValue(
    undefined as never,
  );
});

describe("reset-password route", () => {
  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 30 });
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(await res.json()).toEqual({ error: "tooManyRequests" });
  });

  it("returns 400 invalidRequestBody on unparseable body", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 with the first zod message on invalid input", async () => {
    const res = await POST(
      jsonReq({ token: "t", newPassword: "short", confirmPassword: "short" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "newPasswordTooShort" });
  });

  it("returns 400 passwordsDoNotMatch when confirmation differs", async () => {
    const res = await POST(
      jsonReq({
        token: "t",
        newPassword: "longenough1",
        confirmPassword: "different1",
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "passwordsDoNotMatch" });
  });

  it("returns 400 invalidResetToken when the token is unknown", async () => {
    vi.mocked(findPasswordResetTokenByHash).mockResolvedValue(
      null as unknown as Awaited2<typeof findPasswordResetTokenByHash>,
    );
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidResetToken" });
  });

  it("returns 400 invalidResetToken when the token is expired", async () => {
    vi.mocked(isResetTokenExpired).mockReturnValue(true);
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidResetToken" });
  });

  it("updates the password, deletes tokens, invalidates sessions, returns 200", async () => {
    const res = await POST(jsonReq(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith(42, "argon-hash");
    expect(deletePasswordResetTokensForUser).toHaveBeenCalledWith(42);
    expect(lucia.invalidateUserSessions).toHaveBeenCalledWith("42");
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
