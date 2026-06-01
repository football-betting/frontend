import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminderSent, reminderSetting } from "@/db/schema";

export interface ReminderSettingRow {
  userId: number;
  leadMinutes: number;
}

export async function getEnabledLeadMinutes(userId: number): Promise<number[]> {
  const rows = await db
    .select({ leadMinutes: reminderSetting.leadMinutes })
    .from(reminderSetting)
    .where(eq(reminderSetting.userId, userId));
  return rows.map((r) => r.leadMinutes);
}

// Replace a user's enabled lead times with the given set (full overwrite).
export async function replaceLeadMinutes(
  userId: number,
  leadMinutes: number[],
): Promise<void> {
  const unique = Array.from(new Set(leadMinutes));
  await db.transaction((tx) => {
    tx.delete(reminderSetting)
      .where(eq(reminderSetting.userId, userId))
      .run();
    for (const lead of unique) {
      tx.insert(reminderSetting)
        .values({ userId, leadMinutes: lead })
        .run();
    }
  });
}

export async function getAllReminderSettings(): Promise<ReminderSettingRow[]> {
  const rows = await db
    .select({
      userId: reminderSetting.userId,
      leadMinutes: reminderSetting.leadMinutes,
    })
    .from(reminderSetting);
  return rows.map((r) => ({ userId: r.userId, leadMinutes: r.leadMinutes }));
}

export async function getSentKeysForMatches(
  matchIds: number[],
): Promise<Set<string>> {
  if (matchIds.length === 0) return new Set();
  const rows = await db
    .select({
      userId: reminderSent.userId,
      matchId: reminderSent.matchId,
      leadMinutes: reminderSent.leadMinutes,
    })
    .from(reminderSent);
  const wanted = new Set(matchIds);
  const keys = new Set<string>();
  for (const r of rows) {
    if (wanted.has(r.matchId)) {
      keys.add(`${r.userId}:${r.matchId}:${r.leadMinutes}`);
    }
  }
  return keys;
}

// Idempotent insert: the unique index `(user_id, match_id, lead_minutes)` is
// the dedup safety net. Returns true when a new row was written, false when it
// already existed (so a concurrent cron run never double-sends).
export async function markReminderSent(
  userId: number,
  matchId: number,
  leadMinutes: number,
  sentAt: Date,
): Promise<boolean> {
  const inserted = await db
    .insert(reminderSent)
    .values({ userId, matchId, leadMinutes, sentAt })
    .onConflictDoNothing({
      target: [
        reminderSent.userId,
        reminderSent.matchId,
        reminderSent.leadMinutes,
      ],
    })
    .returning({ id: reminderSent.id });
  return inserted.length > 0;
}

export async function hasReminderBeenSent(
  userId: number,
  matchId: number,
  leadMinutes: number,
): Promise<boolean> {
  const rows = await db
    .select({ id: reminderSent.id })
    .from(reminderSent)
    .where(
      and(
        eq(reminderSent.userId, userId),
        eq(reminderSent.matchId, matchId),
        eq(reminderSent.leadMinutes, leadMinutes),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
