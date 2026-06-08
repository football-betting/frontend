import { describe, expect, it } from "vitest";
import { getUserByEmail } from "@/lib/user";
import { getUpcomingMatches } from "@/lib/match";
import {
  getEmailDisabledUserIds,
  getEnabledLeadMinutes,
  getSentKeysForMatches,
  isEmailEnabled,
  markReminderSent,
  replaceLeadMinutes,
  setEmailEnabled,
} from "@/lib/reminder-store";
import { first, SEED_EMAIL } from "./helpers";

describe("reminder store (round-trip on seeded DB)", () => {
  it("replaces and reads enabled lead minutes (deduped, full overwrite)", async () => {
    const u = await getUserByEmail(SEED_EMAIL.marie);
    await replaceLeadMinutes(u!.id, [60, 1440, 60]);
    expect(new Set(await getEnabledLeadMinutes(u!.id))).toEqual(
      new Set([60, 1440]),
    );

    await replaceLeadMinutes(u!.id, [360]);
    expect(await getEnabledLeadMinutes(u!.id)).toEqual([360]);
  });

  it("dedups markReminderSent per (user, match, lead, channel)", async () => {
    const u = await getUserByEmail(SEED_EMAIL.marie);
    const matchId = first(
      await getUpcomingMatches(),
      "seed has no upcoming match",
    ).id;
    const now = new Date();

    expect(await markReminderSent(u!.id, matchId, 1440, "email", now)).toBe(
      true,
    );
    // Same slot again → no new row.
    expect(await markReminderSent(u!.id, matchId, 1440, "email", now)).toBe(
      false,
    );
    // Different channel is an independent slot.
    expect(await markReminderSent(u!.id, matchId, 1440, "push", now)).toBe(true);

    const keys = await getSentKeysForMatches([matchId]);
    expect(keys.has(`${u!.id}:${matchId}:1440:email`)).toBe(true);
    expect(keys.has(`${u!.id}:${matchId}:1440:push`)).toBe(true);
  });

  it("toggles email enabled (on by default, opt-out, opt-in)", async () => {
    const u = await getUserByEmail(SEED_EMAIL.nikola);
    expect(await isEmailEnabled(u!.id)).toBe(true);

    await setEmailEnabled(u!.id, false);
    expect(await isEmailEnabled(u!.id)).toBe(false);
    expect((await getEmailDisabledUserIds([u!.id])).has(u!.id)).toBe(true);

    await setEmailEnabled(u!.id, true);
    expect(await isEmailEnabled(u!.id)).toBe(true);
    expect((await getEmailDisabledUserIds([u!.id])).has(u!.id)).toBe(false);
  });
});
