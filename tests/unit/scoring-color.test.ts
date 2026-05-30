import { describe, expect, it } from "vitest";
import { scoreColor } from "@/lib/scoring";

describe("scoreColor", () => {
  it("maps 5 to success", () => {
    expect(scoreColor(5)).toBe("success");
  });

  it("maps 3 to warning", () => {
    expect(scoreColor(3)).toBe("warning");
  });

  it("maps 2 to neutral", () => {
    expect(scoreColor(2)).toBe("neutral");
  });

  it("maps 0 to danger", () => {
    expect(scoreColor(0)).toBe("danger");
  });

  it("falls back to neutral for unknown values", () => {
    expect(scoreColor(4)).toBe("neutral");
    expect(scoreColor(1)).toBe("neutral");
    expect(scoreColor(7)).toBe("neutral");
    expect(scoreColor(-1)).toBe("neutral");
  });
});
