import type { RatingMatchInfo } from "@/lib/rating";

export type TipCategory = "exact" | "diff" | "wins" | "none";
export type HistoryFilter = "exact" | "diff" | "wins";
export type SortKey = "points" | "date";
export type SortDir = "asc" | "desc";

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export const DEFAULT_SORT: SortState = { key: "date", dir: "desc" };

export const PAGE_SIZE = 20;
export const PAGINATION_THRESHOLD = 30;

export function tipCategory(score: number): TipCategory {
  if (score === 5) return "exact";
  if (score === 3) return "diff";
  if (score === 2) return "wins";
  return "none";
}

export function matchesFilter(
  tip: RatingMatchInfo,
  filter: HistoryFilter | null,
): boolean {
  if (filter === null) return true;
  return tipCategory(tip.score) === filter;
}

export function filterTips(
  tips: RatingMatchInfo[],
  filter: HistoryFilter | null,
): RatingMatchInfo[] {
  if (filter === null) return tips;
  return tips.filter((tip) => matchesFilter(tip, filter));
}

export function compareTips(
  a: RatingMatchInfo,
  b: RatingMatchInfo,
  sort: SortState,
): number {
  const raw =
    sort.key === "points" ? a.score - b.score : a.date - b.date;
  return sort.dir === "asc" ? raw : -raw;
}

export function sortTips(
  tips: RatingMatchInfo[],
  sort: SortState,
): RatingMatchInfo[] {
  return [...tips].sort((a, b) => compareTips(a, b, sort));
}

export function toggleSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: "desc" };
}

export function pageCount(totalItems: number, pageSize = PAGE_SIZE): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function isPaginated(
  totalItems: number,
  threshold = PAGINATION_THRESHOLD,
): boolean {
  return totalItems > threshold;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = PAGE_SIZE,
): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
