import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/push-store", () => ({
  savePushSubscription: vi.fn(),
  deletePushSubscriptionForUser: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { getCurrentSession } from "@/lib/session";
import {
  deletePushSubscriptionForUser,
  savePushSubscription,
} from "@/lib/push-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { DELETE, POST } from "@/app/api/user/push-subscription/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function jsonReq(method: string, body: unknown): Request {
  return new Request("http://localhost/api/user/push-subscription", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SUB = {
  endpoint: "https://push.example.com/abc",
  keys: { p256dh: "key-p256", auth: "key-auth" },
};

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedIn("8");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  vi.mocked(savePushSubscription).mockResolvedValue(
    undefined as unknown as Awaited2<typeof savePushSubscription>,
  );
  vi.mocked(deletePushSubscriptionForUser).mockResolvedValue(
    undefined as unknown as Awaited2<typeof deletePushSubscriptionForUser>,
  );
});

describe("push-subscription POST", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST(jsonReq("POST", SUB));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 9 });
    const res = await POST(jsonReq("POST", SUB));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("9");
  });

  it("returns 400 invalidRequestBody on unparseable JSON", async () => {
    const req = new Request("http://localhost/api/user/push-subscription", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidRequestBody" });
  });

  it("returns 400 on a schema violation (missing keys)", async () => {
    const res = await POST(
      jsonReq("POST", { endpoint: "https://push.example.com/abc" }),
    );
    expect(res.status).toBe(400);
    expect(savePushSubscription).not.toHaveBeenCalled();
  });

  it("returns 400 when the endpoint is not a URL", async () => {
    const res = await POST(
      jsonReq("POST", { endpoint: "not-a-url", keys: { p256dh: "a", auth: "b" } }),
    );
    expect(res.status).toBe(400);
  });

  it("saves the subscription and returns 200", async () => {
    const res = await POST(jsonReq("POST", SUB));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(savePushSubscription).toHaveBeenCalledWith(
      8,
      { endpoint: SUB.endpoint, p256dh: "key-p256", auth: "key-auth" },
      expect.any(Date),
    );
  });

  it("returns 500 when the save throws", async () => {
    vi.mocked(savePushSubscription).mockRejectedValue(new Error("db"));
    const res = await POST(jsonReq("POST", SUB));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdateReminders" });
  });
});

describe("push-subscription DELETE", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await DELETE(jsonReq("DELETE", { endpoint: SUB.endpoint }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false });
    const res = await DELETE(jsonReq("DELETE", { endpoint: SUB.endpoint }));
    expect(res.status).toBe(429);
  });

  it("returns 400 on invalid endpoint", async () => {
    const res = await DELETE(jsonReq("DELETE", { endpoint: "nope" }));
    expect(res.status).toBe(400);
    expect(deletePushSubscriptionForUser).not.toHaveBeenCalled();
  });

  it("deletes the subscription and returns 200", async () => {
    const res = await DELETE(jsonReq("DELETE", { endpoint: SUB.endpoint }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deletePushSubscriptionForUser).toHaveBeenCalledWith(8, SUB.endpoint);
  });

  it("returns 500 when the delete throws", async () => {
    vi.mocked(deletePushSubscriptionForUser).mockRejectedValue(new Error("db"));
    const res = await DELETE(jsonReq("DELETE", { endpoint: SUB.endpoint }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToUpdateReminders" });
  });
});
