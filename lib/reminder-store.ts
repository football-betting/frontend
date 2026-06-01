import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reminderChannel, reminderSent, reminderSetting } from "@/db/schema";
import { isValidChannel, type ReminderChannel } from "@/lib/reminders";

export interface ReminderSettingRow {
  userId: number;
  leadMinutes: number;
}

export interface ReminderChannelRow {
  userId: number;
  channel: ReminderChannel;
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

export async function hasReminderBeenSent(
  userId: number,
  matchId: number,
  leadMinutes: number,
  channel: ReminderChannel,
): Promise<boolean> {
  const rows = await db
    .select({ id: reminderSent.id })
    .from(reminderSent)
    .where(
      and(
        eq(reminderSent.userId, userId),
        eq(reminderSent.matchId, matchId),
        eq(reminderSent.leadMinutes, leadMinutes),
        eq(reminderSent.channel, channel),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

// Channels a user has explicitly enabled. Email stays the default elsewhere
// (see `channelsForUser` in the cron) — this returns only stored rows.
export async function getEnabledChannels(
  userId: number,
): Promise<ReminderChannel[]> {
  const rows = await db
    .select({ channel: reminderChannel.channel })
    .from(reminderChannel)
    .where(eq(reminderChannel.userId, userId));
  return rows
    .map((r) => r.channel)
    .filter((c): c is ReminderChannel => isValidChannel(c));
}

export async function getAllReminderChannels(): Promise<ReminderChannelRow[]> {
  const rows = await db
    .select({
      userId: reminderChannel.userId,
      channel: reminderChannel.channel,
    })
    .from(reminderChannel);
  const out: ReminderChannelRow[] = [];
  for (const r of rows) {
    if (isValidChannel(r.channel)) {
      out.push({ userId: r.userId, channel: r.channel });
    }
  }
  return out;
}

export async function setChannelEnabled(
  userId: number,
  channel: ReminderChannel,
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    await db
      .insert(reminderChannel)
      .values({ userId, channel })
      .onConflictDoNothing({
        target: [reminderChannel.userId, reminderChannel.channel],
      })
      .run();
  } else {
    await db
      .delete(reminderChannel)
      .where(
        and(
          eq(reminderChannel.userId, userId),
          eq(reminderChannel.channel, channel),
        ),
      )
      .run();
  }
}
