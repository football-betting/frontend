import { describe, expect, it } from "vitest";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenExpired,
  resetTokenExpiry,
} from "@/lib/password-reset";

describe("password reset token logic", () => {
  it("generates a 64-char hex token (32 random bytes)", () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).not.toEqual(b);
  });

  it("hashes a token deterministically with SHA-256 (64 hex chars)", () => {
    const token = "abc123";
    const hash = hashResetToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashResetToken(token)).toEqual(hash);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashResetToken("one")).not.toEqual(hashResetToken("two"));
  });

  it("never stores the raw token (hash differs from token)", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).not.toEqual(token);
  });

  it("computes expiry one hour ahead", () => {
    const now = 1_000_000;
    const expiry = resetTokenExpiry(now);
    expect(expiry.getTime()).toBe(now + RESET_TOKEN_TTL_MS);
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("treats a future expiry as valid", () => {
    const now = 1_000_000;
    const expiry = new Date(now + 1000);
    expect(isResetTokenExpired(expiry, now)).toBe(false);
  });

  it("treats a past expiry as expired", () => {
    const now = 1_000_000;
    const expiry = new Date(now - 1000);
    expect(isResetTokenExpired(expiry, now)).toBe(true);
  });

  it("treats an exactly-elapsed expiry as expired", () => {
    const now = 1_000_000;
    const expiry = new Date(now);
    expect(isResetTokenExpired(expiry, now)).toBe(true);
  });

  it("validates a freshly-issued token's expiry as not expired", () => {
    const now = Date.now();
    const expiry = resetTokenExpiry(now);
    expect(isResetTokenExpired(expiry, now)).toBe(false);
  });
});
