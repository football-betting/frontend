import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminderEmailOff, reminderSent, reminderSetting } from "@/db/schema";
import { type ReminderChannel } from "@/lib/reminders";

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

// Dedup keys are now scoped per channel: `${user}:${match}:${lead}:${channel}`
// mirrors the unique index, so an email send and a push send for the same slot
// are tracked independently.
export async function getSentKeysForMatches(
  matchIds: number[],
): Promise<Set<string>> {
  if (matchIds.length === 0) return new Set();
  const rows = await db
    .select({
      userId: reminderSent.userId,
      matchId: reminderSent.matchId,
      leadMinutes: reminderSent.leadMinutes,
      channel: reminderSent.channel,
    })
    .from(reminderSent);
  const wanted = new Set(matchIds);
  const keys = new Set<string>();
  for (const r of rows) {
    if (wanted.has(r.matchId)) {
      keys.add(`${r.userId}:${r.matchId}:${r.leadMinutes}:${r.channel}`);
    }
  }
  return keys;
}

// Idempotent insert: the unique index `(user_id, match_id, lead_minutes,
// channel)` is the dedup safety net. Returns true when a new row was written,
// false when it already existed (so a concurrent cron run never double-sends,
// and email vs push for the same slot dedup independently).
export async function markReminderSent(
  userId: number,
  matchId: number,
  leadMinutes: number,
  channel: ReminderChannel,
  sentAt: Date,
): Promise<boolean> {
  const inserted = await db
    .insert(reminderSent)
    .values({ userId, matchId, leadMinutes, channel, sentAt })
    .onConflictDoNothing({
      target: [
        reminderSent.userId,
        reminderSent.matchId,
        reminderSent.leadMinutes,
        reminderSent.channel,
      ],
    })
    .returning({ id: reminderSent.id });
  return inserted.length > 0;
}

// Email is on by default (FE-073): a user has email reminders ENABLED unless a
// `reminder_email_off` row marks them as opted out.
export async function isEmailEnabled(userId: number): Promise<boolean> {
  const rows = await db
    .select({ userId: reminderEmailOff.userId })
    .from(reminderEmailOff)
    .where(eq(reminderEmailOff.userId, userId))
    .limit(1);
  return rows.length === 0;
}

export async function setEmailEnabled(
  userId: number,
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    await db
      .delete(reminderEmailOff)
      .where(eq(reminderEmailOff.userId, userId))
      .run();
  } else {
    await db
      .insert(reminderEmailOff)
      .values({ userId })
      .onConflictDoNothing({ target: reminderEmailOff.userId })
      .run();
  }
}

// Users (out of the given set) who have email reminders DISABLED. The cron uses
// this to derive per-user email state: enabled = not in this set.
export async function getEmailDisabledUserIds(
  userIds: number[],
): Promise<Set<number>> {
  if (userIds.length === 0) return new Set();
  const wanted = new Set(userIds);
  const rows = await db
    .select({ userId: reminderEmailOff.userId })
    .from(reminderEmailOff);
  const out = new Set<number>();
  for (const r of rows) {
    if (wanted.has(r.userId)) out.add(r.userId);
  }
  return out;
}
