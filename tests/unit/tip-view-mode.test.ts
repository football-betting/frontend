import { describe, expect, it } from "vitest";
import {
  formatTipScore,
  initialTipEditing,
  type TipScore,
} from "@/lib/tip-view";

describe("initialTipEditing", () => {
  it("opens the form when there is no existing tip", () => {
    expect(initialTipEditing(null)).toBe(true);
  });

  it("starts in view mode when a tip already exists", () => {
    const tip: TipScore = { scoreHome: 2, scoreAway: 1 };
    expect(initialTipEditing(tip)).toBe(false);
  });
});

describe("formatTipScore", () => {
  it("renders the predicted result as spaced text", () => {
    expect(formatTipScore({ scoreHome: 2, scoreAway: 1 })).toBe("2 : 1");
  });

  it("handles zero scores", () => {
    expect(formatTipScore({ scoreHome: 0, scoreAway: 0 })).toBe("0 : 0");
  });
});
