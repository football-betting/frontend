import { beforeEach, describe, expect, it, vi } from "vitest";

const { hashMock } = vi.hoisted(() => ({
  hashMock: vi.fn(async () => "argon-hash"),
}));
vi.mock("oslo/password", () => ({
  Argon2id: class {
    hash = hashMock;
  },
}));
vi.mock("@/lib/user", () => ({
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { createUser, getUserByEmail } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { DEPARTMENTS } from "@/lib/data/departments";
import { POST } from "@/app/api/user/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

const DEPT = DEPARTMENTS[0];

function signupReq(
  fields: Record<string, string>,
  accept?: string,
): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  const headers: Record<string, string> = {};
  if (accept) headers.accept = accept;
  return new Request("http://localhost/api/user", {
    method: "POST",
    headers,
    body: fd,
  });
}

const VALID: Record<string, string> = {
  email: "newbie@valantic.com",
  password: "longpassword1",
  rePassword: "longpassword1",
  username: "newbie",
  department: DEPT,
  winner: "EGY",
  secretWinner: "ALG",
};

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue("argon-hash");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(getUserByEmail).mockResolvedValue(
    undefined as unknown as Awaited2<typeof getUserByEmail>,
  );
  vi.mocked(createUser).mockResolvedValue(
    undefined as unknown as Awaited2<typeof createUser>,
  );
});

describe("user signup route", () => {
  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 11 });
    const res = await POST(signupReq(VALID));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("11");
  });

  it("returns 400 missingRequiredFields when a field is absent", async () => {
    const { username: _omit, ...rest } = VALID;
    void _omit;
    const res = await POST(signupReq(rest));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "missingRequiredFields" });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("returns 400 with the first zod message on invalid input", async () => {
    const res = await POST(signupReq({ ...VALID, email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidEmail" });
  });

  it("returns 400 passwordsDoNotMatch when passwords differ", async () => {
    const res = await POST(
      signupReq({ ...VALID, rePassword: "differentpw1" }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "passwordsDoNotMatch" });
  });

  it("returns 400 winnersMustDiffer when both picks are equal", async () => {
    const res = await POST(signupReq({ ...VALID, secretWinner: "EGY" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "winnersMustDiffer" });
  });

  it("returns 400 emailAlreadyRegistered when the email is taken", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue({
      id: 1,
      email: VALID.email,
    } as unknown as Awaited2<typeof getUserByEmail>);
    const res = await POST(signupReq(VALID));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "emailAlreadyRegistered" });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates the user and redirects to /login?registered=true (302)", async () => {
    const res = await POST(signupReq(VALID));
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login?registered=true");
    expect(createUser).toHaveBeenCalledWith({
      email: VALID.email,
      password: "argon-hash",
      username: VALID.username,
      department: DEPT,
      winner: "EGY",
      secretWinner: "ALG",
    });
  });

  it("returns 200 JSON when the client accepts application/json", async () => {
    const res = await POST(signupReq(VALID, "application/json"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 409 usernameTaken on a SQLite unique-constraint error", async () => {
    vi.mocked(createUser).mockRejectedValue(
      Object.assign(new Error("x"), { code: "SQLITE_CONSTRAINT_UNIQUE" }),
    );
    const res = await POST(signupReq(VALID));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "usernameTaken" });
  });

  it("rethrows non-constraint errors from createUser", async () => {
    vi.mocked(createUser).mockRejectedValue(new Error("boom"));
    await expect(POST(signupReq(VALID))).rejects.toThrow("boom");
  });
});
