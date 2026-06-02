// Pure, DB-free reminder logic. Kept free of `@/lib/db` / `server-only` so it
// can be unit-tested and its lead-time constants reused in client components
// without dragging server-only code into a client bundle.

export const REMINDER_LEAD_MINUTES = [1440, 720, 360, 180, 60] as const;

export type ReminderLeadMinutes = (typeof REMINDER_LEAD_MINUTES)[number];

const LEAD_SET: ReadonlySet<number> = new Set(REMINDER_LEAD_MINUTES);

export function isValidLeadMinutes(value: number): value is ReminderLeadMinutes {
  return LEAD_SET.has(value);
}

// Delivery channels for a reminder. A lead time decides WHEN to notify; a
// channel decides HOW. Forward-compatible: adding e.g. "sms" only needs a new
// member here. "email" is the historical default (FE-059).
export const REMINDER_CHANNELS = ["email", "push"] as const;

export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

const CHANNEL_SET: ReadonlySet<string> = new Set(REMINDER_CHANNELS);

export function isValidChannel(value: string): value is ReminderChannel {
  return CHANNEL_SET.has(value);
}

// Channels to fan a reminder out to for one user (FE-073). Email and push are
// INDEPENDENT, account-wide channels: email is on by default but can be turned
// off; push is "on" for the account when the user has at least one device
// subscription. Either, both, or NEITHER may be active — zero channels is
// allowed (reminders are simply inactive). The returned list is email-first.
export function activeChannels({
  email,
  push,
}: {
  email: boolean;
  push: boolean;
}): ReminderChannel[] {
  const channels: ReminderChannel[] = [];
  if (email) channels.push("email");
  if (push) channels.push("push");
  return channels;
}

// Reminders only fire when at least one channel is active. Used by the cron to
// skip users with no channel and by the UI to gate the lead-time toggles.
export function remindersActive(channels: readonly ReminderChannel[]): boolean {
  return channels.length > 0;
}

// Outcome of attempting to deliver one channel for one slot. Mark-on-success
// (FE-066): a slot is only burned in `reminder_sent` once it was actually
// delivered, so a failed or targetless attempt is retried by a later run.
export interface DeliveryAttempt {
  channel: ReminderChannel;
  // email: resolved without throwing. push: at least one subscription accepted.
  delivered: boolean;
}

// Whether a delivery attempt earns its dedup slot. Pure so the cron's
// reserve/skip decision is unit-testable.
export function shouldMarkDelivery(attempt: DeliveryAttempt): boolean {
  return attempt.delivered;
}

// The external football API marks fixtures with a confirmed kickoff as "TIMED"
// (not "SCHEDULED"), so both count as upcoming/scheduled across the app.
export const UPCOMING_MATCH_STATUSES = ["SCHEDULED", "TIMED"] as const;
const UPCOMING_STATUS_SET: ReadonlySet<string> = new Set(UPCOMING_MATCH_STATUSES);

export function isUpcomingStatus(status: string): boolean {
  return UPCOMING_STATUS_SET.has(status);
}

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

  if (!isUpcomingStatus(match.status)) return [];
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
