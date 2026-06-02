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
  const originalDisable = process.env.DISABLE_RATE_LIMIT;

  beforeEach(() => {
    _internal.buckets.clear();
    delete process.env.DISABLE_RATE_LIMIT;
  });

  afterEach(() => {
    if (originalDisable === undefined) {
      delete process.env.DISABLE_RATE_LIMIT;
    } else {
      process.env.DISABLE_RATE_LIMIT = originalDisable;
    }
  });

  it("allows the first MAX_ATTEMPTS calls and blocks the next", () => {
    for (let i = 1; i <= _internal.MAX_ATTEMPTS; i += 1) {
      expect(checkRateLimit("1.1.1.1", "login").ok).toBe(true);
    }
    const blocked = checkRateLimit("1.1.1.1", "login");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("DISABLE_RATE_LIMIT=1 always returns ok and never fills buckets", () => {
    process.env.DISABLE_RATE_LIMIT = "1";
    for (let i = 0; i < _internal.MAX_ATTEMPTS * 5; i += 1) {
      expect(checkRateLimit("9.9.9.9", "login").ok).toBe(true);
    }
    expect(_internal.buckets.size).toBe(0);
  });

  it("DISABLE_RATE_LIMIT='0' / unset → normal limit applies", () => {
    process.env.DISABLE_RATE_LIMIT = "0";
    for (let i = 1; i <= _internal.MAX_ATTEMPTS; i += 1) {
      expect(checkRateLimit("8.8.8.8", "login").ok).toBe(true);
    }
    expect(checkRateLimit("8.8.8.8", "login").ok).toBe(false);
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

  it("derives a per-client untrusted key from XFF when TRUST_PROXY is unset", () => {
    delete process.env.TRUST_PROXY;
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "untrusted:1.2.3.4",
    );
  });

  it("derives a per-client untrusted key from XFF when TRUST_PROXY is '0'", () => {
    process.env.TRUST_PROXY = "0";
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "untrusted:1.2.3.4",
    );
  });

  it("returns 'unknown' when untrusted and no forwarding headers present", () => {
    delete process.env.TRUST_PROXY;
    expect(getClientIp(headers({}))).toBe("unknown");
  });

  it("honors x-forwarded-for when TRUST_PROXY=1", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4" }))).toBe(
      "1.2.3.4",
    );
  });

  it("takes the rightmost (trusted) XFF entry for the default single hop", () => {
    process.env.TRUST_PROXY = "true";
    delete process.env.TRUSTED_PROXY_HOPS;
    expect(getClientIp(headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "5.6.7.8",
    );
  });

  it("honors TRUSTED_PROXY_HOPS by counting from the right", () => {
    process.env.TRUST_PROXY = "1";
    process.env.TRUSTED_PROXY_HOPS = "2";
    expect(
      getClientIp(
        headers({ "x-forwarded-for": "9.9.9.9, 1.2.3.4, 5.6.7.8" }),
      ),
    ).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when TRUST_PROXY=1 and no x-forwarded-for", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("returns 'unknown' when TRUST_PROXY=1 but no proxy headers present", () => {
    process.env.TRUST_PROXY = "1";
    expect(getClientIp(headers({}))).toBe("unknown");
  });

  afterEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });
});

describe("untrusted IP handling avoids a global-lockout bucket", () => {
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

  it("one client exhausting its limit does NOT lock out a different client", () => {
    const attacker = getClientIp(headers({ "x-forwarded-for": "10.0.0.1" }));
    for (let i = 0; i < _internal.MAX_ATTEMPTS; i += 1) {
      checkRateLimit(attacker, "login");
    }
    expect(checkRateLimit(attacker, "login").ok).toBe(false);

    const victim = getClientIp(headers({ "x-forwarded-for": "10.0.0.2" }));
    expect(checkRateLimit(victim, "login").ok).toBe(true);
  });

  it("repeated requests from the same untrusted client are still limited", () => {
    let blocked = 0;
    for (let i = 0; i < 100; i += 1) {
      const ip = getClientIp(headers({ "x-forwarded-for": "10.0.0.5" }));
      const res = checkRateLimit(ip, "login");
      if (!res.ok) blocked += 1;
    }
    expect(blocked).toBe(100 - _internal.MAX_ATTEMPTS);
  });
});
