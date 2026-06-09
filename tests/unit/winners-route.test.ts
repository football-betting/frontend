import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/user", () => ({ updateUserWinners: vi.fn() }));
vi.mock("@/lib/tournament", () => ({ isTournamentLocked: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { getCurrentSession } from "@/lib/session";
import { updateUserWinners } from "@/lib/user";
import { isTournamentLocked } from "@/lib/tournament";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/user/winners/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/user/winners", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PICKS = { winner: "EGY", secretWinner: "ALG" };

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedIn("9");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(isTournamentLocked).mockResolvedValue(false);
  vi.mocked(updateUserWinners).mockResolvedValue(
    undefined as unknown as Awaited2<typeof updateUserWinners>,
  );
});

describe("user/winners route", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST(jsonReq(PICKS));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 6 });
    const res = await POST(jsonReq(PICKS));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("6");
  });

  it("returns 400 picksLocked once the tournament is locked", async () => {
    vi.mocked(isTournamentLocked).mockResolvedValue(true);
    const res = await POST(jsonReq(PICKS));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "picksLocked" });
    expect(updateUserWinners).not.toHaveBeenCalled();
  });

  it("returns 400 invalidRequestBody on unparseable JSON", async () => {
    const req = new Request("http://localhost/api/user/winners", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 on an unknown team code", async () => {
    const res = await POST(jsonReq({ winner: "ZZZ", secretWinner: "ALG" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "winner" });
  });

  it("returns 400 winnersMustDiffer when both picks are equal", async () => {
    const res = await POST(jsonReq({ winner: "EGY", secretWinner: "EGY" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "winnersMustDiffer" });
  });

  it("persists the picks and echoes them back (200)", async () => {
    const res = await POST(jsonReq(PICKS));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      winner: "EGY",
      secretWinner: "ALG",
    });
    expect(updateUserWinners).toHaveBeenCalledWith(9, "EGY", "ALG");
  });

  it("returns 500 when the store throws", async () => {
    vi.mocked(updateUserWinners).mockRejectedValue(new Error("db"));
    const res = await POST(jsonReq(PICKS));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdateWinners" });
  });
});
