import { describe, expect, it } from "vitest";
import { groupByDate, type MatchRow } from "@/lib/match";

// Local-time components so the day key is deterministic regardless of the test
// runner's timezone (formatDateKey uses local getFullYear/Month/Date).
function match(id: number, day: number, hour: number): MatchRow {
  return {
    id,
    homeTeam: { name: `H${id}`, tla: "H" },
    awayTeam: { name: `A${id}`, tla: "A" },
    status: "TIMED",
    utcDate: new Date(2026, 5, day, hour, 0, 0),
    homeScore: null,
    awayScore: null,
  };
}

describe("groupByDate", () => {
  it("buckets matches by their calendar day, preserving order", () => {
    const groups = groupByDate([
      match(1, 11, 19),
      match(2, 11, 22),
      match(3, 12, 2),
    ]);
    expect(Object.keys(groups).sort()).toEqual(["2026-06-11", "2026-06-12"]);
    expect(groups["2026-06-11"]?.map((m) => m.id)).toEqual([1, 2]);
    expect(groups["2026-06-12"]?.map((m) => m.id)).toEqual([3]);
  });

  it("returns an empty object for no matches", () => {
    expect(groupByDate([])).toEqual({});
  });
});
