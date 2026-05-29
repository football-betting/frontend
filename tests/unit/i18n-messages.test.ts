import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function collectKeys(value: Json, prefix = ""): string[] {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return [prefix];
  }
  const keys: string[] = [];
  for (const key of Object.keys(value).sort()) {
    const next = prefix ? `${prefix}.${key}` : key;
    keys.push(...collectKeys(value[key], next));
  }
  return keys;
}

describe("i18n message catalogs", () => {
  it("de and en have identical key structure", () => {
    const deKeys = collectKeys(de as Json);
    const enKeys = collectKeys(en as Json);

    const missingInEn = deKeys.filter((k) => !enKeys.includes(k));
    const missingInDe = enKeys.filter((k) => !deKeys.includes(k));

    expect(missingInEn, "keys present in de but missing in en").toEqual([]);
    expect(missingInDe, "keys present in en but missing in de").toEqual([]);
    expect(enKeys).toEqual(deKeys);
  });

  it("has no empty string values", () => {
    for (const [label, catalog] of [
      ["de", de],
      ["en", en],
    ] as const) {
      for (const key of collectKeys(catalog as Json)) {
        const value = key
          .split(".")
          .reduce<Json>(
            (acc, part) =>
              acc !== null && typeof acc === "object" && !Array.isArray(acc)
                ? acc[part]
                : acc,
            catalog as Json,
          );
        expect(
          typeof value === "string" ? value.length : 1,
          `${label}.${key} must not be empty`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
