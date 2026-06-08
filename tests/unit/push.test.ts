import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setVapidDetails = vi.fn();
const sendNotification = vi.fn();

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: (...args: unknown[]) => setVapidDetails(...args),
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

import {
  _internal,
  buildPushPayload,
  isGoneStatus,
  sendPush,
} from "@/lib/push";

const VAPID_ENV = {
  VAPID_SUBJECT: "mailto:test@example.com",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
  VAPID_PRIVATE_KEY: "private-key",
} as const;

function setVapidEnv(): void {
  vi.stubEnv("VAPID_SUBJECT", VAPID_ENV.VAPID_SUBJECT);
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", VAPID_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  vi.stubEnv("VAPID_PRIVATE_KEY", VAPID_ENV.VAPID_PRIVATE_KEY);
}

const subscription = {
  endpoint: "https://push.example.com/abc",
  p256dh: "p256dh-key",
  auth: "auth-key",
};

describe("buildPushPayload", () => {
  it("serializes exactly title, body and url for the service worker", () => {
    const json = buildPushPayload({
      title: "Tipp-Erinnerung",
      body: "Du hast dieses Spiel noch nicht getippt.",
      url: "https://example.com/match/42",
    });
    expect(JSON.parse(json)).toEqual({
      title: "Tipp-Erinnerung",
      body: "Du hast dieses Spiel noch nicht getippt.",
      url: "https://example.com/match/42",
    });
  });
});

describe("isGoneStatus", () => {
  it("treats 404 and 410 as a dead subscription", () => {
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(410)).toBe(true);
  });

  it("does not treat other statuses as gone", () => {
    expect(isGoneStatus(429)).toBe(false);
    expect(isGoneStatus(500)).toBe(false);
    expect(isGoneStatus(201)).toBe(false);
  });
});

describe("readVapidConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the full config when all VAPID env vars are present", () => {
    setVapidEnv();
    expect(_internal.readVapidConfig()).toEqual({
      subject: VAPID_ENV.VAPID_SUBJECT,
      publicKey: VAPID_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKey: VAPID_ENV.VAPID_PRIVATE_KEY,
    });
  });

  it("throws listing every missing var when none are set", () => {
    vi.stubEnv("VAPID_SUBJECT", "");
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    expect(() => _internal.readVapidConfig()).toThrowError(
      "Web push is not configured: missing VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY",
    );
  });

  it("throws naming only the single missing var", () => {
    vi.stubEnv("VAPID_SUBJECT", VAPID_ENV.VAPID_SUBJECT);
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", VAPID_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    expect(() => _internal.readVapidConfig()).toThrowError(
      "Web push is not configured: missing VAPID_PRIVATE_KEY",
    );
  });
});

describe("sendPush", () => {
  beforeEach(() => {
    setVapidEnv();
    _internal.resetVapidConfigured();
    setVapidDetails.mockReset();
    sendNotification.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns {ok:true} on a successful send and configures VAPID once", async () => {
    sendNotification.mockResolvedValue(undefined);
    const payload = buildPushPayload({ title: "t", body: "b", url: "u" });

    const first = await sendPush(subscription, payload);
    const second = await sendPush(subscription, payload);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    // ensureVapidConfigured only runs setVapidDetails on the first call.
    expect(setVapidDetails).toHaveBeenCalledTimes(1);
    expect(setVapidDetails).toHaveBeenCalledWith(
      VAPID_ENV.VAPID_SUBJECT,
      VAPID_ENV.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      VAPID_ENV.VAPID_PRIVATE_KEY,
    );
    expect(sendNotification).toHaveBeenCalledWith(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );
  });

  it("returns {ok:false, gone:true} when the push service responds 410", async () => {
    sendNotification.mockRejectedValue({ statusCode: 410 });
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: true, statusCode: 410 });
  });

  it("returns {ok:false, gone:true} when the push service responds 404", async () => {
    sendNotification.mockRejectedValue({ statusCode: 404 });
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: true, statusCode: 404 });
  });

  it("returns {ok:false, gone:false, statusCode} for a non-gone error status", async () => {
    sendNotification.mockRejectedValue({ statusCode: 500 });
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: false, statusCode: 500 });
  });

  it("returns statusCode null for an error without a numeric statusCode", async () => {
    sendNotification.mockRejectedValue(new Error("network down"));
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: false, statusCode: null });
  });

  it("returns statusCode null when statusCode is not a number", async () => {
    sendNotification.mockRejectedValue({ statusCode: "410" });
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: false, statusCode: null });
  });

  it("returns a failure (statusCode null) when VAPID config is missing", async () => {
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    _internal.resetVapidConfigured();
    const result = await sendPush(subscription, "payload");
    expect(result).toEqual({ ok: false, gone: false, statusCode: null });
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
