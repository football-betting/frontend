const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_BUCKETS = 10_000;
const SWEEP_MS = 60 * 1000;

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

let sweepTimer: ReturnType<typeof setInterval> | undefined;

function startSweep(): void {
  if (sweepTimer || typeof setInterval !== "function") return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(key);
    }
  }, SWEEP_MS);
  if (typeof sweepTimer === "object" && sweepTimer !== null && "unref" in sweepTimer) {
    (sweepTimer as { unref(): void }).unref();
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number;
}

let warnedAboutProdBypass = false;

function isRateLimitDisabled(): boolean {
  const value = process.env.DISABLE_RATE_LIMIT;
  const enabled =
    !!value &&
    ["1", "true", "yes"].includes(value.toLowerCase());

  // In production the bypass is ignored entirely: rate limiting is always on,
  // regardless of the env var. The dev/test bypass still works elsewhere.
  if (process.env.NODE_ENV === "production") {
    if (enabled && !warnedAboutProdBypass) {
      console.warn(
        "[rate-limit] DISABLE_RATE_LIMIT is set in NODE_ENV=production and " +
          "is being IGNORED. This is a dev/test-only bypass.",
      );
      warnedAboutProdBypass = true;
    }
    return false;
  }

  return enabled;
}

export function checkRateLimit(ip: string, bucket: string): RateLimitResult {
  if (isRateLimitDisabled()) {
    return { ok: true };
  }

  startSweep();

  if (buckets.size >= MAX_BUCKETS) {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(key);
      if (buckets.size < MAX_BUCKETS) break;
    }
    if (buckets.size >= MAX_BUCKETS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
  }

  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export function resetRateLimit(ip: string, bucket: string): void {
  buckets.delete(`${bucket}:${ip}`);
}

function isTrustProxy(): boolean {
  const value = process.env.TRUST_PROXY;
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

// Number of trusted reverse-proxy hops in front of the app. With N trusted
// hops, the client IP is the Nth entry counted from the RIGHT of
// X-Forwarded-For (the rightmost entries are appended by our own proxies and
// cannot be spoofed; everything to the left is client-supplied). Defaults to 1
// (a single trusted proxy → the last XFF entry is the real client).
function trustedProxyHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parseXff(headers: Headers): string[] {
  const xff = headers.get("x-forwarded-for");
  if (!xff) return [];
  return xff
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function getClientIp(headers: Headers): string {
  if (isTrustProxy()) {
    const chain = parseXff(headers);
    if (chain.length > 0) {
      // Take the Nth-from-the-right entry — the leftmost is spoofable.
      const idx = chain.length - trustedProxyHops();
      const ip = chain[Math.max(0, idx)];
      if (ip) return ip;
    }
    const real = headers.get("x-real-ip");
    if (real) return real.trim();
    return "unknown";
  }

  // No trusted proxy: client-supplied headers are NOT authoritative, but
  // collapsing every request into one shared "unknown" bucket would let a
  // single attacker lock out all users (global DoS). To avoid that, derive a
  // best-effort per-client key from whatever forwarding header is present.
  // This is spoofable (a rate-limit is only one defense layer) but it removes
  // the global-lockout footgun. The "untrusted:" prefix keeps these buckets
  // from ever colliding with trusted-proxy identities.
  const chain = parseXff(headers);
  const candidate = chain[0] ?? headers.get("x-real-ip")?.trim();
  if (candidate) return `untrusted:${candidate}`;
  return "unknown";
}

export const _internal = {
  buckets,
  MAX_ATTEMPTS,
  WINDOW_MS,
  MAX_BUCKETS,
  SWEEP_MS,
};
