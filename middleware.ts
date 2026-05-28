import { NextResponse, type NextRequest } from "next/server";
import { verifyRequestOrigin } from "lucia";

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === "/api/match/import") {
    return NextResponse.next();
  }

  if (request.method !== "GET") {
    const originHeader = request.headers.get("Origin");
    const hostHeader =
      request.headers.get("X-Forwarded-Host") ?? request.headers.get("Host");
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return new NextResponse(null, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|svg/).*)"],
};
