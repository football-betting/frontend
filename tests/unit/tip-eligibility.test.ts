import { describe, expect, it } from "vitest";

interface EligibilityMatch {
  utcDate: Date;
  homeScore: number | null;
  awayScore: number | null;
}

function canEditTip(match: EligibilityMatch, now: Date): boolean {
  return (
    match.utcDate.getTime() >= now.getTime() &&
    match.homeScore === null &&
    match.awayScore === null
  );
}

const NOW = new Date("2026-05-28T12:00:00Z");

describe("canEditTip", () => {
  it("allows tipping a scheduled match in the future without a score", () => {
    const match: EligibilityMatch = {
      utcDate: new Date(NOW.getTime() + 60_000),
      homeScore: null,
      awayScore: null,
    };
    expect(canEditTip(match, NOW)).toBe(true);
  });

  it("blocks tipping when kickoff is in the past", () => {
    const match: EligibilityMatch = {
      utcDate: new Date(NOW.getTime() - 60_000),
      homeScore: null,
      awayScore: null,
    };
    expect(canEditTip(match, NOW)).toBe(false);
  });

  it("blocks tipping when homeScore is set even with a future kickoff", () => {
    const match: EligibilityMatch = {
      utcDate: new Date(NOW.getTime() + 60_000),
      homeScore: 1,
      awayScore: null,
    };
    expect(canEditTip(match, NOW)).toBe(false);
  });

  it("blocks tipping when awayScore is set", () => {
    const match: EligibilityMatch = {
      utcDate: new Date(NOW.getTime() + 60_000),
      homeScore: null,
      awayScore: 0,
    };
    expect(canEditTip(match, NOW)).toBe(false);
  });

  it("blocks tipping for a finished match with both scores set", () => {
    const match: EligibilityMatch = {
      utcDate: new Date(NOW.getTime() - 86_400_000),
      homeScore: 2,
      awayScore: 1,
    };
    expect(canEditTip(match, NOW)).toBe(false);
  });
});
