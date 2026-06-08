import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { resolveAppOrigin } from "@/lib/app-origin";

function request(origin: string): NextRequest {
  return { nextUrl: { origin } } as unknown as NextRequest;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveAppOrigin", () => {
  it("uses APP_BASE_URL and strips trailing slashes", () => {
    vi.stubEnv("APP_BASE_URL", "https://wm.example.com//");
    expect(resolveAppOrigin(request("http://localhost:3000"))).toBe(
      "https://wm.example.com",
    );
  });

  it("returns null in production when APP_BASE_URL is unset (fail closed)", () => {
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveAppOrigin(request("http://evil.test"))).toBeNull();
  });

  it("falls back to the request origin outside production", () => {
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveAppOrigin(request("http://localhost:3000"))).toBe(
      "http://localhost:3000",
    );
  });
});
