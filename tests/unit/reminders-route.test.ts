import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/reminder-store", () => ({ replaceLeadMinutes: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { getCurrentSession } from "@/lib/session";
import { replaceLeadMinutes } from "@/lib/reminder-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { GET, PUT } from "@/app/api/user/reminders/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/user/reminders", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedIn("4");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(replaceLeadMinutes).mockResolvedValue(
    undefined as unknown as Awaited2<typeof replaceLeadMinutes>,
  );
});

describe("user/reminders route", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await PUT(jsonReq({ leadMinutes: [60] }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 7 });
    const res = await PUT(jsonReq({ leadMinutes: [60] }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("7");
  });

  it("returns 400 invalidRequestBody on unparseable JSON", async () => {
    const req = new Request("http://localhost/api/user/reminders", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 invalidInput on an unknown lead-minute value", async () => {
    const res = await PUT(jsonReq({ leadMinutes: [999] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidInput" });
    expect(replaceLeadMinutes).not.toHaveBeenCalled();
  });

  it("persists a valid lead-minute set and echoes it back", async () => {
    const res = await PUT(jsonReq({ leadMinutes: [1440, 60] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      leadMinutes: [1440, 60],
    });
    expect(replaceLeadMinutes).toHaveBeenCalledWith(4, [1440, 60]);
  });

  it("accepts an empty set (clear all reminders)", async () => {
    const res = await PUT(jsonReq({ leadMinutes: [] }));
    expect(res.status).toBe(200);
    expect(replaceLeadMinutes).toHaveBeenCalledWith(4, []);
  });

  it("returns 500 when the store throws", async () => {
    vi.mocked(replaceLeadMinutes).mockRejectedValue(new Error("db"));
    const res = await PUT(jsonReq({ leadMinutes: [60] }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdateReminders" });
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
