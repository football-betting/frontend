import { describe, expect, it } from "vitest";
import { isLockedFromTimestamp } from "@/lib/tournament";

describe("isLockedFromTimestamp", () => {
  const now = 1_700_000_000_000;

  it("returns false when there are no matches (min is null)", () => {
    expect(isLockedFromTimestamp(null, now)).toBe(false);
  });

  it("returns true when the earliest match is in the past", () => {
    const oneHourAgoSeconds = Math.floor(now / 1000) - 3600;
    expect(isLockedFromTimestamp(oneHourAgoSeconds, now)).toBe(true);
  });

  it("returns true at the exact kickoff instant", () => {
    const nowSeconds = Math.floor(now / 1000);
    expect(isLockedFromTimestamp(nowSeconds, nowSeconds * 1000)).toBe(true);
  });

  it("returns false when every match is in the future", () => {
    const oneHourFromNowSeconds = Math.floor(now / 1000) + 3600;
    expect(isLockedFromTimestamp(oneHourFromNowSeconds, now)).toBe(false);
  });
});
