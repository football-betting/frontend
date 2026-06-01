import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetTokenExpiry(now: number = Date.now()): Date {
  return new Date(now + RESET_TOKEN_TTL_MS);
}

export function isResetTokenExpired(
  expiresAt: Date,
  now: number = Date.now(),
): boolean {
  return expiresAt.getTime() <= now;
}
