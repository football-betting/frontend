import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { tip } from "@/db/schema";

export type TipRow = typeof tip.$inferSelect;

export async function getTipByUserAndMatchIds(
  userId: number,
  matchIds: number[],
): Promise<TipRow[]> {
  if (matchIds.length === 0) return [];
  return db
    .select()
    .from(tip)
    .where(and(eq(tip.userId, userId), inArray(tip.matchId, matchIds)));
}

export async function getTipByUserAndMatch(
  userId: number,
  matchId: number,
): Promise<TipRow | undefined> {
  const rows = await db
    .select()
    .from(tip)
    .where(and(eq(tip.userId, userId), eq(tip.matchId, matchId)))
    .limit(1);
  return rows[0];
}

export async function saveTip(
  userId: number,
  matchId: number,
  scoreHome: number,
  scoreAway: number,
): Promise<TipRow> {
  const now = new Date();
  // Atomic upsert keyed on the (user_id, match_id) UNIQUE INDEX
  // (`tip_user_match_unique`). Guarantees a single row per (user, match)
  // even under concurrent writes across Node workers.
  await db
    .insert(tip)
    .values({ userId, matchId, date: now, scoreHome, scoreAway })
    .onConflictDoUpdate({
      target: [tip.userId, tip.matchId],
      set: { scoreHome, scoreAway, date: now },
    });
  const fresh = await getTipByUserAndMatch(userId, matchId);
  if (!fresh) {
    throw new Error("Tip upsert failed to persist");
  }
  return fresh;
}
