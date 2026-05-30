import { describe, expect, it } from "vitest";
import { resolveCountryName } from "@/lib/country";

function makeTranslator(catalog: Record<string, string>) {
  const t = (key: string): string => catalog[key] ?? key;
  return Object.assign(t, {
    has: (key: string): boolean => key in catalog,
  });
}

describe("resolveCountryName", () => {
  it("returns the localized name when the TLA is mapped", () => {
    const t = makeTranslator({ GER: "Deutschland" });
    expect(resolveCountryName("GER", "Germany", t)).toBe("Deutschland");
  });

  it("falls back to the stored name when the TLA is unmapped", () => {
    const t = makeTranslator({ GER: "Deutschland" });
    expect(resolveCountryName("XYZ", "Atlantis", t)).toBe("Atlantis");
  });
});
