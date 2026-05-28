import { describe, expect, it } from "vitest";
import { displayDepartment } from "@/lib/data/departments";

describe("displayDepartment", () => {
  it("rewrites the misspelled 'Maintz' to 'Mainz'", () => {
    expect(displayDepartment("Maintz")).toBe("Mainz");
  });

  it("returns Mannheim unchanged", () => {
    expect(displayDepartment("Mannheim")).toBe("Mannheim");
  });

  it("returns Langenfeld unchanged", () => {
    expect(displayDepartment("Langenfeld")).toBe("Langenfeld");
  });
});
