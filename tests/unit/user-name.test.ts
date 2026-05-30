import { describe, expect, it } from "vitest";
import { displayNameFromEmail } from "@/lib/user-name";

describe("displayNameFromEmail", () => {
  it("derives a full name from a dotted local part", () => {
    expect(displayNameFromEmail("rafal.wesolowski@cec.valantic.com")).toBe(
      "Rafal Wesolowski",
    );
  });

  it("handles the local.dev seed format", () => {
    expect(displayNameFromEmail("rosa.parks@local.dev")).toBe("Rosa Parks");
  });

  it("returns a single capitalized word when there is no dot", () => {
    expect(displayNameFromEmail("ada@dev.local")).toBe("Ada");
  });

  it("handles multiple dots in the local part", () => {
    expect(displayNameFromEmail("jean.luc.picard@local.dev")).toBe(
      "Jean Luc Picard",
    );
  });

  it("ignores empty segments from consecutive dots", () => {
    expect(displayNameFromEmail("rosa..parks@local.dev")).toBe("Rosa Parks");
  });
});
