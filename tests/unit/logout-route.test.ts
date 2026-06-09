import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: cookieSet })),
}));
vi.mock("@/lib/auth", () => ({
  lucia: {
    invalidateSession: vi.fn(),
    createBlankSessionCookie: vi.fn(),
  },
}));
vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));

import { lucia } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session";
import { GET, POST } from "@/app/api/auth/logout/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(lucia.invalidateSession).mockResolvedValue(undefined as never);
  vi.mocked(lucia.createBlankSessionCookie).mockReturnValue({
    name: "auth_session",
    value: "",
    attributes: { path: "/", maxAge: 0 },
  } as unknown as ReturnType<typeof lucia.createBlankSessionCookie>);
});

describe("logout route", () => {
  it("invalidates the active session and redirects to /login", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: { id: "1" },
      session: { id: "sess-1" },
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST();
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
    expect(lucia.invalidateSession).toHaveBeenCalledWith("sess-1");
    expect(cookieSet).toHaveBeenCalledWith(
      "auth_session",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("redirects to /login even with no active session (idempotent)", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST();
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
    expect(lucia.invalidateSession).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalled();
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
