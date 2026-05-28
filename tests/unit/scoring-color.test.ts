import { describe, expect, it } from "vitest";
import { scoreColor } from "@/lib/scoring";

describe("scoreColor", () => {
  it("maps 4 to success", () => {
    expect(scoreColor(4)).toBe("success");
  });

  it("maps 2 to warning", () => {
    expect(scoreColor(2)).toBe("warning");
  });

  it("maps 1 to neutral", () => {
    expect(scoreColor(1)).toBe("neutral");
  });

  it("maps 0 to danger", () => {
    expect(scoreColor(0)).toBe("danger");
  });

  it("falls back to neutral for unknown values", () => {
    expect(scoreColor(3)).toBe("neutral");
    expect(scoreColor(7)).toBe("neutral");
    expect(scoreColor(-1)).toBe("neutral");
  });
});
