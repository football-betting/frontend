import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  _internal,
  checkRateLimit,
  getClientIp,
  resetRateLimit,
} from "@/lib/rate-limit";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    _internal.buckets.clear();
  });

  it("allows the first MAX_ATTEMPTS calls and blocks the next", () => {
    for (let i = 1; i <= _internal.MAX_ATTEMPTS; i += 1) {
      expect(checkRateLimit("1.1.1.1", "login").ok).toBe(true);
    }
    const blocked = checkRateLimit("1.1.1.1", "login");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("uses independent buckets per (bucket, ip) pair", () => {
    for (let i = 0; i < _internal.MAX_ATTEMPTS; i += 1) {
      checkRateLimit("1.1.1.1", "login");
    }
    expect(checkRateLimit("1.1.1.1", "login").ok).toBe(false);
    expect(checkRateLimit("1.1.1.1", "signup").ok).toBe(true);
    expect(checkRateLimit("2.2.2.2", "login").ok).toBe(true);
  });

  it("resetRateLimit clears the bucket", () => {
    for (let i = 0; i < _internal.MAX_ATTEMPTS; i += 1) {
      checkRateLimit("3.3.3.3", "login");
    }
    expect(checkRateLimit("3.3.3.3", "login").ok).toBe(false);
    resetRateLimit("3.3.3.3", "login");
    expect(checkRateLimit("3.3.3.3", "login").ok).toBe(true);
  });
});

describe("getClientIp", () => {
  const originalTrustProxy = process.env.TRUST_PROXY;

  afterEach(() => {
    if (originalTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = originalTrustProxy;
    }
  });

  it("ignores x-forwarded-for when TRUST_PROXY is unset", () => {
    delete process.env.TRUST_PROXY;
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "unknown",
    );
  });

  it("ignores x-forwarded-for when TRUST_PROXY is '0'", () => {
    process.env.TRUST_PROXY = "0";
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "unknown",
    );
  });

  it("honors x-forwarded-for when TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "1.2.3.4",
    );
  });

  it("honors x-forwarded-for when TRUST_PROXY=true", () => {
    process.env.TRUST_PROXY = "true";
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "1.2.3.4",
    );
  });

  it("falls back to x-real-ip when TRUST_PROXY=1 and no x-forwarded-for", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("returns 'unknown' when TRUST_PROXY=1 but no proxy headers present", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({}))).toBe("unknown");
  });
});

describe("spoofed X-Forwarded-For without TRUST_PROXY does not bypass limit", () => {
  const originalTrustProxy = process.env.TRUST_PROXY;

  beforeEach(() => {
    _internal.buckets.clear();
    delete process.env.TRUST_PROXY;
  });

  afterEach(() => {
    if (originalTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = originalTrustProxy;
    }
  });

  it("100 requests with rotating fake XFF all bucket under 'unknown'", () => {
    let blocked = 0;
    for (let i = 0; i < 100; i += 1) {
      const ip = getClientIp(
        headers({ "x-forwarded-for": `10.0.${i}.${i}` }),
      );
      const res = checkRateLimit(ip, "login");
      if (!res.ok) blocked += 1;
    }
    expect(blocked).toBe(100 - _internal.MAX_ATTEMPTS);
  });
});
