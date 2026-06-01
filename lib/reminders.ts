// Pure, DB-free reminder logic. Kept free of `@/lib/db` / `server-only` so it
// can be unit-tested and its lead-time constants reused in client components
// without dragging server-only code into a client bundle.

export const REMINDER_LEAD_MINUTES = [1440, 720, 360, 180, 60] as const;

export type ReminderLeadMinutes = (typeof REMINDER_LEAD_MINUTES)[number];

const LEAD_SET: ReadonlySet<number> = new Set(REMINDER_LEAD_MINUTES);

export function isValidLeadMinutes(value: number): value is ReminderLeadMinutes {
  return LEAD_SET.has(value);
}

const SCHEDULED_STATUS = "SCHEDULED";

export interface EligibleMatch {
  id: number;
  utcDate: Date;
  status: string;
}

export interface EligibilityInput {
  now: Date;
  match: EligibleMatch;
  enabledLeadMinutes: Iterable<number>;
  tippedMatchIds: ReadonlySet<number>;
  sentKeys: ReadonlySet<string>;
}

// Stable key for the `(match_id, lead_minutes)` dedup set the cron passes in,
// mirroring the `reminder_sent` unique index.
export function sentKey(matchId: number, leadMinutes: number): string {
  return `${matchId}:${leadMinutes}`;
}

// Returns which of the user's enabled lead times are DUE to send now for this
// match. A lead L is due iff:
//   - the match is SCHEDULED, and
//   - now is within the window: utcDate - L <= now < utcDate, and
//   - the user has NOT tipped the match, and
//   - (match, L) has not already been sent.
export function dueLeadMinutes(input: EligibilityInput): number[] {
  const { now, match, enabledLeadMinutes, tippedMatchIds, sentKeys } = input;

  if (match.status !== SCHEDULED_STATUS) return [];
  if (tippedMatchIds.has(match.id)) return [];

  const nowMs = now.getTime();
  const kickoffMs = match.utcDate.getTime();
  if (nowMs >= kickoffMs) return [];

  const due: number[] = [];
  for (const lead of enabledLeadMinutes) {
    if (!isValidLeadMinutes(lead)) continue;
    const windowStartMs = kickoffMs - lead * 60_000;
    if (nowMs < windowStartMs) continue;
    if (sentKeys.has(sentKey(match.id, lead))) continue;
    due.push(lead);
  }
  return due;
}
