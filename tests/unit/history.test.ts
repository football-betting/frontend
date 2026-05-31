import { describe, expect, it } from "vitest";
import type { RatingMatchInfo } from "@/lib/rating";
import {
  compareTips,
  DEFAULT_SORT,
  filterTips,
  isPaginated,
  matchesFilter,
  PAGE_SIZE,
  pageCount,
  paginate,
  sortTips,
  tipCategory,
  toggleSort,
  type SortState,
} from "@/lib/history";

function makeTip(
  overrides: Partial<RatingMatchInfo> & { score: number; date: number },
): RatingMatchInfo {
  return {
    match_id: `m${overrides.date}-${overrides.score}`,
    user: "u",
    user_id: 1,
    team1: { name: "Alpha", tla: "ALP" },
    team2: { name: "Beta", tla: "BET" },
    tip_home: 1,
    tip_away: 0,
    score_home: 1,
    score_away: 0,
    ...overrides,
  };
}

describe("tipCategory", () => {
  it("maps 5 to exact", () => {
    expect(tipCategory(5)).toBe("exact");
  });
  it("maps 3 to diff", () => {
    expect(tipCategory(3)).toBe("diff");
  });
  it("maps 2 to wins", () => {
    expect(tipCategory(2)).toBe("wins");
  });
  it("maps 0 to none", () => {
    expect(tipCategory(0)).toBe("none");
  });
  it("maps any other score to none", () => {
    expect(tipCategory(1)).toBe("none");
    expect(tipCategory(4)).toBe("none");
    expect(tipCategory(-1)).toBe("none");
  });
});

describe("matchesFilter / filterTips", () => {
  const tips = [
    makeTip({ score: 5, date: 100 }),
    makeTip({ score: 3, date: 200 }),
    makeTip({ score: 2, date: 300 }),
    makeTip({ score: 0, date: 400 }),
  ];

  it("returns true for any tip when filter is null", () => {
    expect(matchesFilter(tips[0], null)).toBe(true);
    expect(matchesFilter(tips[3], null)).toBe(true);
  });

  it("matches only the requested category", () => {
    expect(matchesFilter(tips[0], "exact")).toBe(true);
    expect(matchesFilter(tips[1], "exact")).toBe(false);
    expect(matchesFilter(tips[1], "diff")).toBe(true);
    expect(matchesFilter(tips[2], "wins")).toBe(true);
  });

  it("returns all tips unchanged when filter is null", () => {
    expect(filterTips(tips, null)).toEqual(tips);
  });

  it("filters to exact only", () => {
    expect(filterTips(tips, "exact").map((t) => t.score)).toEqual([5]);
  });

  it("filters to wins only (score 2)", () => {
    expect(filterTips(tips, "wins").map((t) => t.score)).toEqual([2]);
  });

  it("excludes none-category tips from any filter", () => {
    expect(filterTips(tips, "exact")).not.toContain(tips[3]);
  });
});

describe("compareTips / sortTips", () => {
  const a = makeTip({ score: 2, date: 100 });
  const b = makeTip({ score: 5, date: 300 });
  const c = makeTip({ score: 3, date: 200 });

  it("sorts by points ascending", () => {
    const sorted = sortTips([b, a, c], { key: "points", dir: "asc" });
    expect(sorted.map((t) => t.score)).toEqual([2, 3, 5]);
  });

  it("sorts by points descending", () => {
    const sorted = sortTips([a, c, b], { key: "points", dir: "desc" });
    expect(sorted.map((t) => t.score)).toEqual([5, 3, 2]);
  });

  it("sorts by date ascending", () => {
    const sorted = sortTips([b, a, c], { key: "date", dir: "asc" });
    expect(sorted.map((t) => t.date)).toEqual([100, 200, 300]);
  });

  it("sorts by date descending", () => {
    const sorted = sortTips([a, c, b], { key: "date", dir: "desc" });
    expect(sorted.map((t) => t.date)).toEqual([300, 200, 100]);
  });

  it("does not mutate the input array", () => {
    const input = [b, a, c];
    sortTips(input, { key: "points", dir: "asc" });
    expect(input).toEqual([b, a, c]);
  });

  it("compareTips returns expected sign for points desc", () => {
    expect(compareTips(b, a, { key: "points", dir: "desc" })).toBeLessThan(0);
  });

  it("default sort is date descending", () => {
    expect(DEFAULT_SORT).toEqual({ key: "date", dir: "desc" });
    const sorted = sortTips([a, c, b], DEFAULT_SORT);
    expect(sorted.map((t) => t.date)).toEqual([300, 200, 100]);
  });
});

describe("toggleSort", () => {
  it("flips direction when key is unchanged", () => {
    const start: SortState = { key: "date", dir: "desc" };
    expect(toggleSort(start, "date")).toEqual({ key: "date", dir: "asc" });
    expect(toggleSort({ key: "date", dir: "asc" }, "date")).toEqual({
      key: "date",
      dir: "desc",
    });
  });

  it("switches to a new key defaulting to desc", () => {
    expect(toggleSort({ key: "date", dir: "asc" }, "points")).toEqual({
      key: "points",
      dir: "desc",
    });
  });
});

describe("pagination helpers", () => {
  it("isPaginated is true only above 30 entries", () => {
    expect(isPaginated(30)).toBe(false);
    expect(isPaginated(31)).toBe(true);
    expect(isPaginated(0)).toBe(false);
  });

  it("pageCount computes ceil over page size", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(20)).toBe(1);
    expect(pageCount(21)).toBe(2);
    expect(pageCount(40)).toBe(2);
    expect(pageCount(41)).toBe(3);
  });

  it("paginate slices the requested page", () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    expect(paginate(items, 1)).toEqual(items.slice(0, PAGE_SIZE));
    expect(paginate(items, 2)).toEqual(items.slice(PAGE_SIZE, PAGE_SIZE * 2));
    expect(paginate(items, 3)).toEqual(items.slice(PAGE_SIZE * 2));
  });

  it("paginate returns empty for out-of-range page", () => {
    expect(paginate([1, 2, 3], 5)).toEqual([]);
  });
});
