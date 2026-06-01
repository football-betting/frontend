import { describe, expect, it } from "vitest";
import {
  REMINDER_LEAD_MINUTES,
  dueLeadMinutes,
  isValidLeadMinutes,
  sentKey,
} from "@/lib/reminders";

const KICKOFF = new Date("2026-06-01T20:00:00.000Z");

function matchAt(date: Date, status = "SCHEDULED") {
  return { id: 42, utcDate: date, status };
}

describe("isValidLeadMinutes", () => {
  it("accepts only members of the fixed lead set", () => {
    for (const lead of REMINDER_LEAD_MINUTES) {
      expect(isValidLeadMinutes(lead)).toBe(true);
    }
    expect(isValidLeadMinutes(15)).toBe(false);
    expect(isValidLeadMinutes(0)).toBe(false);
  });
});

describe("dueLeadMinutes", () => {
  const enabled = [720, 60];
  const noTips = new Set<number>();
  const noSent = new Set<string>();

  it("returns leads whose window has opened (due)", () => {
    // 90 min before kickoff: the 720 (12h) window is open, the 60 is not yet.
    const now = new Date(KICKOFF.getTime() - 90 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: enabled,
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([720]);
  });

  it("opens a lead window exactly at utcDate - lead (inclusive)", () => {
    const now = new Date(KICKOFF.getTime() - 60 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: [60],
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([60]);
  });

  it("returns nothing before any window opens (not yet in window)", () => {
    // 13h before kickoff: even the 12h window has not opened.
    const now = new Date(KICKOFF.getTime() - 13 * 60 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: enabled,
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([]);
  });

  it("returns nothing once the match has started (now >= utcDate)", () => {
    const now = new Date(KICKOFF.getTime());
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: enabled,
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([]);
  });

  it("returns nothing for a non-SCHEDULED match", () => {
    const now = new Date(KICKOFF.getTime() - 90 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF, "IN_PLAY"),
      enabledLeadMinutes: enabled,
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([]);
  });

  it("returns nothing if the user already tipped the match", () => {
    const now = new Date(KICKOFF.getTime() - 90 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: enabled,
      tippedMatchIds: new Set([42]),
      sentKeys: noSent,
    });
    expect(due).toEqual([]);
  });

  it("skips a lead that was already sent (dedup)", () => {
    const now = new Date(KICKOFF.getTime() - 90 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: enabled,
      tippedMatchIds: noTips,
      sentKeys: new Set([sentKey(42, 720)]),
    });
    expect(due).toEqual([]);
  });

  it("ignores lead values outside the fixed set", () => {
    const now = new Date(KICKOFF.getTime() - 90 * 60_000);
    const due = dueLeadMinutes({
      now,
      match: matchAt(KICKOFF),
      enabledLeadMinutes: [720, 15],
      tippedMatchIds: noTips,
      sentKeys: noSent,
    });
    expect(due).toEqual([720]);
  });
});
