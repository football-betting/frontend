import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// The cron route orchestrates many data-layer + delivery functions. Mock those
// so the test drives the real eligibility logic (@/lib/reminders stays real)
// without a database, SMTP, or web-push network.
vi.mock("@/lib/match", () => ({ getUpcomingMatches: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/app-origin", () => ({ resolveAppOrigin: vi.fn() }));
vi.mock("@/lib/reminder-store", () => ({
  getAllReminderSettings: vi.fn(),
  getEmailDisabledUserIds: vi.fn(),
  getSentKeysForMatches: vi.fn(),
  markReminderSent: vi.fn(),
}));
vi.mock("@/lib/push-store", () => ({
  getPushSubscriptionsByUserIds: vi.fn(),
  deletePushSubscriptionByEndpoint: vi.fn(),
}));
vi.mock("@/lib/tip", () => ({ getTipByUserAndMatchIds: vi.fn() }));
vi.mock("@/lib/user", () => ({ getUserEmailsByIds: vi.fn() }));
vi.mock("@/lib/mail", () => ({ sendTipReminderEmail: vi.fn() }));
vi.mock("@/lib/push", () => ({
  buildPushPayload: vi.fn(() => "payload"),
  sendPush: vi.fn(),
}));

import { getUpcomingMatches } from "@/lib/match";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAppOrigin } from "@/lib/app-origin";
import {
  getAllReminderSettings,
  getEmailDisabledUserIds,
  getSentKeysForMatches,
  markReminderSent,
} from "@/lib/reminder-store";
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserIds,
} from "@/lib/push-store";
import { getTipByUserAndMatchIds } from "@/lib/tip";
import { getUserEmailsByIds } from "@/lib/user";
import { sendTipReminderEmail } from "@/lib/mail";
import { sendPush } from "@/lib/push";
import { GET, POST } from "@/app/api/cron/notifications/route";

const SECRET = "cron-secret";
let prevSecret: string | undefined;

function makeRequest(secret?: string): NextRequest {
  const headers = new Headers();
  if (secret) headers.set("x-cron-secret", secret);
  return {
    method: "POST",
    headers,
    nextUrl: { origin: "http://localhost" },
  } as unknown as NextRequest;
}

type AwaitedReturn<T extends (...args: never[]) => unknown> = Awaited<
  ReturnType<T>
>;

function match(id: number, offsetMinutes: number) {
  return {
    id,
    homeTeam: { name: `H${id}`, tla: "H" },
    awayTeam: { name: `A${id}`, tla: "A" },
    status: "TIMED",
    utcDate: new Date(Date.now() + offsetMinutes * 60_000),
    homeScore: null,
    awayScore: null,
  };
}

// 13h ahead: only the 1440-minute (24h) lead window is open.
const ONLY_1440 = 780;
// ~3.5h ahead: the 6h/12h/24h windows are all open at once (360/720/1440).
const THREE_LEADS = 210;

const ALL_LEADS = [1440, 720, 360, 180, 60].map((leadMinutes) => ({
  userId: 1,
  leadMinutes,
}));

beforeEach(() => {
  vi.clearAllMocks();
  prevSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = SECRET;

  vi.mocked(checkRateLimit).mockReturnValue({
    ok: true,
  } as AwaitedReturn<typeof checkRateLimit>);
  vi.mocked(resolveAppOrigin).mockReturnValue("https://test");
  vi.mocked(getUpcomingMatches).mockResolvedValue([
    match(1, ONLY_1440),
  ] as AwaitedReturn<typeof getUpcomingMatches>);
  vi.mocked(getAllReminderSettings).mockResolvedValue([
    { userId: 1, leadMinutes: 1440 },
  ] as AwaitedReturn<typeof getAllReminderSettings>);
  vi.mocked(getEmailDisabledUserIds).mockResolvedValue(new Set<number>());
  vi.mocked(getUserEmailsByIds).mockResolvedValue(new Map([[1, "u1@test"]]));
  vi.mocked(getSentKeysForMatches).mockResolvedValue(new Set<string>());
  vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue(
    new Map([
      [1, [{ endpoint: "https://push/1", p256dh: "p", auth: "a" }]],
    ]) as AwaitedReturn<typeof getPushSubscriptionsByUserIds>,
  );
  vi.mocked(getTipByUserAndMatchIds).mockResolvedValue(
    [] as AwaitedReturn<typeof getTipByUserAndMatchIds>,
  );
  vi.mocked(markReminderSent).mockResolvedValue(true);
  vi.mocked(sendTipReminderEmail).mockResolvedValue(undefined);
  vi.mocked(sendPush).mockResolvedValue({
    ok: true,
  } as AwaitedReturn<typeof sendPush>);
});

afterEach(() => {
  if (prevSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = prevSecret;
});

describe("cron notifications — auth", () => {
  it("rejects a request with no secret (401)", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(getUpcomingMatches).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret (401)", async () => {
    const res = await POST(makeRequest("nope"));
    expect(res.status).toBe(401);
  });

  it("rejects GET with 405", () => {
    expect(GET().status).toBe(405);
  });
});

describe("cron notifications — delivery", () => {
  it("sends email + push for an untipped match (sent: 2)", async () => {
    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 2 });
    expect(sendTipReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendTipReminderEmail).toHaveBeenCalledWith(
      "u1@test",
      expect.objectContaining({
        matchLabel: "H1 – A1",
        predictUrl: "https://test/",
      }),
    );
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(markReminderSent).toHaveBeenCalledTimes(2);
  });

  it("does not notify a match the user already tipped (sent: 0)", async () => {
    vi.mocked(getTipByUserAndMatchIds).mockResolvedValue([
      { matchId: 1 },
    ] as AwaitedReturn<typeof getTipByUserAndMatchIds>);
    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 0 });
    expect(sendTipReminderEmail).not.toHaveBeenCalled();
    expect(sendPush).not.toHaveBeenCalled();
  });

  it("does not re-send an already-sent slot (dedup, sent: 0)", async () => {
    vi.mocked(getSentKeysForMatches).mockResolvedValue(
      new Set(["1:1:1440:email", "1:1:1440:push"]),
    );
    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 0 });
    expect(sendTipReminderEmail).not.toHaveBeenCalled();
    expect(sendPush).not.toHaveBeenCalled();
  });
});

describe("cron notifications — channel selection", () => {
  it("skips email when the user opted out (push only)", async () => {
    vi.mocked(getEmailDisabledUserIds).mockResolvedValue(new Set([1]));
    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 1 });
    expect(sendTipReminderEmail).not.toHaveBeenCalled();
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("skips push when the user has no subscription (email only)", async () => {
    vi.mocked(getPushSubscriptionsByUserIds).mockResolvedValue(
      new Map() as AwaitedReturn<typeof getPushSubscriptionsByUserIds>,
    );
    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 1 });
    expect(sendTipReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendPush).not.toHaveBeenCalled();
  });
});

describe("cron notifications — resilience", () => {
  it("leaves the email slot unreserved when sending fails (mark-on-success)", async () => {
    vi.mocked(sendTipReminderEmail).mockRejectedValue(new Error("smtp down"));
    const res = await POST(makeRequest(SECRET));
    // Only the push delivery is counted and reserved; email stays retryable.
    expect(await res.json()).toEqual({ sent: 1 });
    expect(sendTipReminderEmail).toHaveBeenCalledTimes(1);
    expect(markReminderSent).toHaveBeenCalledTimes(1);
    expect(markReminderSent).toHaveBeenCalledWith(
      1,
      1,
      1440,
      "push",
      expect.any(Date),
    );
  });

  it("prunes a gone push subscription without reserving its slot", async () => {
    vi.mocked(sendPush).mockResolvedValue({
      ok: false,
      gone: true,
      statusCode: 410,
    } as AwaitedReturn<typeof sendPush>);
    const res = await POST(makeRequest(SECRET));
    expect(deletePushSubscriptionByEndpoint).toHaveBeenCalledWith(
      "https://push/1",
    );
    // Email still delivered; the dead push endpoint is not counted.
    expect((await res.json()).sent).toBe(1);
  });
});

describe("cron notifications — real-world scenarios", () => {
  it("notifies only the untipped of two matches at the same kickoff", async () => {
    vi.mocked(getUpcomingMatches).mockResolvedValue([
      match(1, ONLY_1440),
      match(2, ONLY_1440),
    ] as AwaitedReturn<typeof getUpcomingMatches>);
    vi.mocked(getTipByUserAndMatchIds).mockResolvedValue([
      { matchId: 1 },
    ] as AwaitedReturn<typeof getTipByUserAndMatchIds>);

    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 2 });
    expect(sendTipReminderEmail).toHaveBeenCalledTimes(1);
    expect(sendTipReminderEmail).toHaveBeenCalledWith(
      "u1@test",
      expect.objectContaining({ matchLabel: "H2 – A2" }),
    );
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("fires every open lead window at once near kickoff (3 leads → 3 emails + 3 pushes)", async () => {
    // A match ~3.5h out with all five lead times enabled: the 6h/12h/24h
    // windows are open together, so three reminders go out per channel in one
    // run. (In real time these arrive spread out: 24h, then 12h, then 6h.)
    vi.mocked(getUpcomingMatches).mockResolvedValue([
      match(1, THREE_LEADS),
    ] as AwaitedReturn<typeof getUpcomingMatches>);
    vi.mocked(getAllReminderSettings).mockResolvedValue(
      ALL_LEADS as AwaitedReturn<typeof getAllReminderSettings>,
    );

    const res = await POST(makeRequest(SECRET));
    expect(await res.json()).toEqual({ sent: 6 });
    expect(sendTipReminderEmail).toHaveBeenCalledTimes(3);
    expect(sendPush).toHaveBeenCalledTimes(3);
  });
});
