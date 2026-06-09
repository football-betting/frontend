import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/match", () => ({ getMatchById: vi.fn() }));
vi.mock("@/lib/tip", () => ({ saveTip: vi.fn() }));

import { getCurrentSession } from "@/lib/session";
import { getMatchById } from "@/lib/match";
import { saveTip } from "@/lib/tip";
import { POST } from "@/app/api/tip/[matchId]/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function ctx(matchId: string): { params: Promise<{ matchId: string }> } {
  return { params: Promise.resolve({ matchId }) };
}

function tipRequest(tip1: string, tip2: string): Request {
  const fd = new FormData();
  fd.set("tip1", tip1);
  fd.set("tip2", tip2);
  return new Request("http://localhost/api/tip/5", { method: "POST", body: fd });
}

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

function futureMatch(
  over: Partial<{ homeScore: number | null; awayScore: number | null }> = {},
): Awaited2<typeof getMatchById> {
  return {
    id: 5,
    utcDate: new Date(Date.now() + 3_600_000),
    homeScore: null,
    awayScore: null,
    ...over,
  } as unknown as Awaited2<typeof getMatchById>;
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedIn("7");
  vi.mocked(getMatchById).mockResolvedValue(futureMatch());
  vi.mocked(saveTip).mockResolvedValue({
    id: 99,
    userId: 7,
    matchId: 5,
    scoreHome: 2,
    scoreAway: 1,
    date: new Date(1700000000000),
  } as unknown as Awaited2<typeof saveTip>);
});

describe("tip route — auth", () => {
  it("rejects an anonymous request with 401 notLoggedIn", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
    expect(saveTip).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric session user id with 401", async () => {
    loggedIn("abc");
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });
});

describe("tip route — match validation", () => {
  it("rejects a non-numeric matchId with 400 matchNotFound", async () => {
    const res = await POST(tipRequest("2", "1"), ctx("abc"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "matchNotFound" });
    expect(getMatchById).not.toHaveBeenCalled();
  });

  it("rejects an unknown match with 400 matchNotFound", async () => {
    vi.mocked(getMatchById).mockResolvedValue(
      null as unknown as Awaited2<typeof getMatchById>,
    );
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "matchNotFound" });
  });

  it("rejects a match already kicked off with 400 matchStartedOrFinished", async () => {
    vi.mocked(getMatchById).mockResolvedValue({
      id: 5,
      utcDate: new Date(Date.now() - 1000),
      homeScore: null,
      awayScore: null,
    } as unknown as Awaited2<typeof getMatchById>);
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "matchStartedOrFinished" });
  });

  it("rejects a match with a score already set with 400 matchStartedOrFinished", async () => {
    vi.mocked(getMatchById).mockResolvedValue(futureMatch({ homeScore: 0 }));
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "matchStartedOrFinished" });
  });
});

describe("tip route — score validation", () => {
  it("rejects a non-numeric score with 400 tipOutOfRange", async () => {
    const res = await POST(tipRequest("x", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "tipOutOfRange" });
  });

  it("rejects a negative score with 400 tipOutOfRange", async () => {
    const res = await POST(tipRequest("-1", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "tipOutOfRange" });
  });

  it("rejects a score above 20 with 400 tipOutOfRange", async () => {
    const res = await POST(tipRequest("21", "1"), ctx("5"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "tipOutOfRange" });
  });
});

describe("tip route — happy path", () => {
  it("saves with the SESSION userId (not a body-supplied one) and returns 200", async () => {
    const fd = new FormData();
    fd.set("tip1", "2");
    fd.set("tip2", "1");
    fd.set("userId", "999"); // attacker-supplied — must be ignored
    const req = new Request("http://localhost/api/tip/5", {
      method: "POST",
      body: fd,
    });

    const res = await POST(req, ctx("5"));
    expect(res.status).toBe(200);
    expect(saveTip).toHaveBeenCalledTimes(1);
    expect(saveTip).toHaveBeenCalledWith(7, 5, 2, 1);
    expect(await res.json()).toEqual({
      success: true,
      tip: {
        id: 99,
        userId: 7,
        matchId: 5,
        scoreHome: 2,
        scoreAway: 1,
        date: 1700000000000,
      },
    });
  });

  it("accepts the boundary scores 0 and 20", async () => {
    const res = await POST(tipRequest("0", "20"), ctx("5"));
    expect(res.status).toBe(200);
    expect(saveTip).toHaveBeenCalledWith(7, 5, 0, 20);
  });

  it("returns 500 failedToSave when saveTip throws", async () => {
    vi.mocked(saveTip).mockRejectedValue(new Error("db down"));
    const res = await POST(tipRequest("2", "1"), ctx("5"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToSave" });
  });
});
