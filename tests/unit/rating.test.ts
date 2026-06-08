import { describe, expect, it } from "vitest";
import { sliceGlobalShortTable, type RatingUser } from "@/lib/rating";

function makeUser(userId: number, position: number): RatingUser {
  return {
    name: `user-${userId}`,
    user_id: userId,
    department: "Langenfeld",
    position,
    score_sum: 0,
    sum_win_exact: 0,
    sum_score_diff: 0,
    sum_team: 0,
    extra_point: 0,
    tips: [],
  };
}

function makeGlobal(count: number): RatingUser[] {
  return Array.from({ length: count }, (_, i) => makeUser(i + 1, i + 1));
}

describe("sliceGlobalShortTable", () => {
  it("returns empty rows and no gap for an empty global table", () => {
    expect(sliceGlobalShortTable([], 1)).toEqual({
      topRows: [],
      neighborRows: [],
      hasGap: false,
    });
  });

  it("shows the top 6 and no gap when the current user is unknown", () => {
    const global = makeGlobal(10);
    const slice = sliceGlobalShortTable(global, 999);
    expect(slice.hasGap).toBe(false);
    expect(slice.neighborRows).toEqual([]);
    expect(slice.topRows.map((u) => u.user_id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("shows the top 6 and no gap when the current user is in the top 3", () => {
    const global = makeGlobal(10);
    const slice = sliceGlobalShortTable(global, 2);
    expect(slice.hasGap).toBe(false);
    expect(slice.neighborRows).toEqual([]);
    expect(slice.topRows).toHaveLength(6);
  });

  it("treats the 4th-place user (first of the tail) as no-gap", () => {
    // userIndexInTail === 0 → not > 0, falls through to the top-6 branch.
    const global = makeGlobal(10);
    const slice = sliceGlobalShortTable(global, 4);
    expect(slice.hasGap).toBe(false);
    expect(slice.neighborRows).toEqual([]);
    expect(slice.topRows).toHaveLength(6);
  });

  it("returns top 3 plus a 3-row neighbor window with a gap for a mid-table user", () => {
    const global = makeGlobal(10);
    // current user_id 7 → index 6 → tail index 3 (>0) → gap branch.
    const slice = sliceGlobalShortTable(global, 7);
    expect(slice.hasGap).toBe(true);
    expect(slice.topRows.map((u) => u.user_id)).toEqual([1, 2, 3]);
    // tail = ids 4..10; tail index 3 → start 2, end 5 → ids 6,7,8.
    expect(slice.neighborRows.map((u) => u.user_id)).toEqual([6, 7, 8]);
  });

  it("clamps the neighbor window at the start of the tail (5th-place user)", () => {
    const global = makeGlobal(10);
    // current user_id 5 → tail index 1 (>0) → start = max(0, 0) = 0, end = 3.
    const slice = sliceGlobalShortTable(global, 5);
    expect(slice.hasGap).toBe(true);
    expect(slice.neighborRows.map((u) => u.user_id)).toEqual([4, 5, 6]);
  });

  it("returns only the available neighbors when the user is last", () => {
    const global = makeGlobal(10);
    // current user_id 10 → tail index 6 → start 5, end 8 (clamped by slice).
    const slice = sliceGlobalShortTable(global, 10);
    expect(slice.hasGap).toBe(true);
    expect(slice.neighborRows.map((u) => u.user_id)).toEqual([9, 10]);
  });
});
