import { describe, expect, it } from "vitest";
import { scoreColor, scoreToneClass, type ScoreTone } from "@/lib/scoring";

describe("scoreColor", () => {
  it("maps 5 points to success", () => {
    expect(scoreColor(5)).toBe("success");
  });

  it("maps 3 points to warning", () => {
    expect(scoreColor(3)).toBe("warning");
  });

  it("maps 0 points to danger", () => {
    expect(scoreColor(0)).toBe("danger");
  });

  it("maps any other value (e.g. 2) to neutral", () => {
    expect(scoreColor(2)).toBe("neutral");
    expect(scoreColor(1)).toBe("neutral");
    expect(scoreColor(99)).toBe("neutral");
  });
});

describe("scoreToneClass", () => {
  it("returns the matching text class for each tone", () => {
    const cases: Array<[ScoreTone, string]> = [
      ["success", "text-success"],
      ["warning", "text-warning"],
      ["danger", "text-danger"],
      ["neutral", "text-neutral"],
    ];
    for (const [tone, cls] of cases) {
      expect(scoreToneClass(tone)).toBe(cls);
    }
  });

  it("round-trips scoreColor output into a class", () => {
    expect(scoreToneClass(scoreColor(5))).toBe("text-success");
    expect(scoreToneClass(scoreColor(3))).toBe("text-warning");
    expect(scoreToneClass(scoreColor(0))).toBe("text-danger");
    expect(scoreToneClass(scoreColor(2))).toBe("text-neutral");
  });
});
