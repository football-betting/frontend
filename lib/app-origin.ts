import type { NextRequest } from "next/server";

// Resolve the trusted base URL for building security-sensitive links
// (password-reset emails, cron predict links). APP_BASE_URL is the single
// source of truth. In production it is REQUIRED — we never fall back to the
// request Host, which is attacker-controllable and enables host-poisoning of
// the generated links. In dev/test the request origin is an acceptable
// convenience fallback. Returns null when no trusted origin is available
// (prod without APP_BASE_URL) so callers can fail closed.
export function resolveAppOrigin(request: NextRequest): string | null {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return request.nextUrl.origin;
}
