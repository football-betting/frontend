import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/reminder-store", () => ({ setEmailEnabled: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { getCurrentSession } from "@/lib/session";
import { setEmailEnabled } from "@/lib/reminder-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { GET, PUT } from "@/app/api/user/reminder-email/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(body: unknown): Request {
  return new Request("http://localhost/api/user/reminder-email", {
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
  loggedIn("11");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(setEmailEnabled).mockResolvedValue(
    undefined as unknown as Awaited2<typeof setEmailEnabled>,
  );
});

describe("user/reminder-email route", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await PUT(jsonReq({ enabled: true }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 3 });
    const res = await PUT(jsonReq({ enabled: true }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3");
  });

  it("returns 400 invalidRequestBody on unparseable JSON", async () => {
    const req = new Request("http://localhost/api/user/reminder-email", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 when enabled is not a boolean", async () => {
    const res = await PUT(jsonReq({ enabled: "yes" }));
    expect(res.status).toBe(400);
    expect(setEmailEnabled).not.toHaveBeenCalled();
  });

  it("enables email reminders and returns 200", async () => {
    const res = await PUT(jsonReq({ enabled: true }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(setEmailEnabled).toHaveBeenCalledWith(11, true);
  });

  it("disables email reminders and returns 200", async () => {
    const res = await PUT(jsonReq({ enabled: false }));
    expect(res.status).toBe(200);
    expect(setEmailEnabled).toHaveBeenCalledWith(11, false);
  });

  it("returns 500 when the store throws", async () => {
    vi.mocked(setEmailEnabled).mockRejectedValue(new Error("db"));
    const res = await PUT(jsonReq({ enabled: true }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdateReminders" });
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
