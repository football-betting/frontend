import { NextResponse, type NextRequest } from "next/server";
import { verifyRequestOrigin } from "lucia";

const isProd = process.env.NODE_ENV === "production";

// Next.js (App Router) currently requires `'unsafe-inline'` for styles
// (styled-jsx + the inline `style={...}` on the auth pages) and for scripts
// in dev mode (HMR + hydration helpers). `'unsafe-eval'` is only granted in
// dev — production stays strict.
const scriptSrc = isProd
  ? ["'self'", "'unsafe-inline'"]
  : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(" ")}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  // The service worker (Serwist defaultCache) re-fetches the Material Symbols
  // icon font from Google Fonts with its own fetch(), which is governed by this
  // CSP. These origins are already trusted by style-src/font-src.
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
};

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(name, value);
  }
  return res;
}

export function proxy(request: NextRequest): NextResponse {
  if (request.method !== "GET") {
    const originHeader = request.headers.get("Origin");
    const hostHeader =
      request.headers.get("X-Forwarded-Host") ?? request.headers.get("Host");
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return withSecurityHeaders(new NextResponse(null, { status: 403 }));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|svg/).*)"],
};
