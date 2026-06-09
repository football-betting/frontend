import { describe, expect, it } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import { FAQ_SECTIONS } from "@/lib/faq";

const CATALOGS = [
  ["de", de],
  ["en", en],
] as const;

const TOTAL_QUESTIONS = 14;

describe("FAQ content", () => {
  it("config covers the expected number of questions", () => {
    const count = FAQ_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    expect(count).toBe(TOTAL_QUESTIONS);
  });

  it("has no duplicate question keys across sections", () => {
    const keys = FAQ_SECTIONS.flatMap((s) => s.items);
    expect(new Set(keys).size).toBe(keys.length);
  });

  for (const [label, catalog] of CATALOGS) {
    describe(`${label} catalog`, () => {
      const faq = (catalog as Record<string, unknown>).FAQ as
        | Record<string, unknown>
        | undefined;

      it("has a title and intro", () => {
        expect(faq).toBeDefined();
        expect(typeof faq?.title).toBe("string");
        expect(typeof faq?.intro).toBe("string");
      });

      it("states the bonus point values that mirror betting-api", () => {
        const items = ((
          faq?.sections as Record<
            string,
            { items?: Record<string, { a?: string }> }
          >
        )?.rules?.items ?? {}) as Record<string, { a?: string }>;
        expect(items.winnerBonus?.a, `${label} winner bonus`).toContain("12");
        expect(items.secretWinner?.a, `${label} secret winner bonus`).toContain(
          "6",
        );
      });

      it("provides a heading and a non-empty q/a for every configured item", () => {
        const sections = faq?.sections as Record<string, unknown> | undefined;
        expect(sections).toBeDefined();

        for (const section of FAQ_SECTIONS) {
          const node = sections?.[section.key] as
            | { heading?: unknown; items?: Record<string, unknown> }
            | undefined;
          expect(node, `${label}.FAQ.sections.${section.key}`).toBeDefined();
          expect(typeof node?.heading).toBe("string");

          for (const item of section.items) {
            const qa = node?.items?.[item] as
              | { q?: unknown; a?: unknown }
              | undefined;
            const path = `${label}.FAQ.sections.${section.key}.items.${item}`;
            expect(typeof qa?.q, `${path}.q`).toBe("string");
            expect(typeof qa?.a, `${path}.a`).toBe("string");
            expect((qa?.q as string).length, `${path}.q`).toBeGreaterThan(0);
            expect((qa?.a as string).length, `${path}.a`).toBeGreaterThan(0);
          }
        }
      });
    });
  }
});
