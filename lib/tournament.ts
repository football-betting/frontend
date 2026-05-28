import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { match } from "@/db/schema";

export function isLockedFromTimestamp(
  minUtcSeconds: number | null,
  nowMs: number,
): boolean {
  if (minUtcSeconds === null) return false;
  return minUtcSeconds * 1000 <= nowMs;
}

export async function isTournamentLocked(): Promise<boolean> {
  const rows = await db
    .select({ min: sql<number | null>`MIN(${match.utcDate})` })
    .from(match);
  const minUtc = rows[0]?.min ?? null;
  return isLockedFromTimestamp(minUtc, Date.now());
}
