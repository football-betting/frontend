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

function isRateLimitDisabled(): boolean {
  const value = process.env.DISABLE_RATE_LIMIT;
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

let warnedAboutProdBypass = false;

export function checkRateLimit(ip: string, bucket: string): RateLimitResult {
  if (isRateLimitDisabled()) {
    if (
      process.env.NODE_ENV === "production" &&
      !warnedAboutProdBypass
    ) {
      console.warn(
        "[rate-limit] DISABLE_RATE_LIMIT is set in NODE_ENV=production. " +
          "This is a dev/test bypass and MUST NOT be enabled in production.",
      );
      warnedAboutProdBypass = true;
    }
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

export function getClientIp(headers: Headers): string {
  if (isTrustProxy()) {
    const xff = headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = headers.get("x-real-ip");
    if (real) return real.trim();
  }
  return "unknown";
}

export const _internal = {
  buckets,
  MAX_ATTEMPTS,
  WINDOW_MS,
  MAX_BUCKETS,
  SWEEP_MS,
};
