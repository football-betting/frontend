import { describe, expect, it } from "vitest";
import { computeScore } from "@/lib/score";

describe("computeScore", () => {
  it("returns 4 for an exact score match (tip 1:0 vs result 1:0)", () => {
    expect(computeScore(1, 0, 1, 0)).toBe(4);
  });

  it("returns 2 for matching goal difference but different totals (tip 3:1 vs result 2:0)", () => {
    expect(computeScore(3, 1, 2, 0)).toBe(2);
  });

  it("returns 1 for correct winner only (tip 2:1 vs result 3:1 — both home wins)", () => {
    expect(computeScore(2, 1, 3, 1)).toBe(1);
  });

  it("returns 2 for a correctly tipped draw with different score — same goal diff of 0 (tip 1:1 vs result 2:2)", () => {
    expect(computeScore(1, 1, 2, 2)).toBe(2);
  });

  it("returns 4 for an exactly matching draw (tip 1:1 vs result 1:1)", () => {
    expect(computeScore(1, 1, 1, 1)).toBe(4);
  });

  it("returns 1 for an away win predicted with different goal difference (tip 0:2 vs result 1:4)", () => {
    expect(computeScore(0, 2, 1, 4)).toBe(1);
  });

  it("returns 0 when winner is wrong (tip 0:1 vs result 1:0)", () => {
    expect(computeScore(0, 1, 1, 0)).toBe(0);
  });
});
