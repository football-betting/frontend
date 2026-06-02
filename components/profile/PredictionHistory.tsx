"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { RatingMatchInfo } from "@/lib/rating";
import { formatDate } from "@/lib/format";
import { scoreColor, scoreToneClass } from "@/lib/scoring";
import { TOURNAMENT_NAME } from "@/lib/data/tournament";
import {
  DEFAULT_SORT,
  filterTips,
  isPaginated,
  pageCount,
  paginate,
  sortTips,
  cycleSort,
  type SortKey,
  type SortState,
} from "@/lib/history";
import { useHistoryFilter } from "@/components/profile/HistoryFilterContext";

type HistoryStatus = "ok" | "offline";

interface PredictionHistoryProps {
  status: HistoryStatus;
  tips: RatingMatchInfo[];
}

function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : "0";
}

function formatScorePair(home: number | null, away: number | null): string {
  const h = home === null ? "—" : String(home);
  const a = away === null ? "—" : String(away);
  return `${h} - ${a}`;
}

function parseDate(date: number): Date {
  return new Date(date * 1000);
}

function sortIndicator(sort: SortState | null, key: SortKey): string {
  if (!sort || sort.key !== key) return "";
  return sort.dir === "asc" ? " ↑" : " ↓";
}

export function PredictionHistory({
  status,
  tips,
}: PredictionHistoryProps): React.ReactElement {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const { filter, setFilter } = useHistoryFilter();
  // `null` = no explicit sort → the default order (DEFAULT_SORT).
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);

  const visibleTips = useMemo(
    () => sortTips(filterTips(tips, filter), sort ?? DEFAULT_SORT),
    [tips, filter, sort],
  );

  const total = visibleTips.length;
  const paginated = isPaginated(total);
  const pages = pageCount(total);
  const currentPage = Math.min(page, pages);
  const pageTips = paginated
    ? paginate(visibleTips, currentPage)
    : visibleTips;

  function handleSort(key: SortKey): void {
    setSort((current) => cycleSort(current, key));
    setPage(1);
  }

  return (
    <section className="mt-xl">
      <div className="flex justify-between items-end border-b border-outline-variant pb-md mb-lg">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-background">
          {t("predictionHistory")}
        </h2>
        <span className="text-label-caps uppercase text-on-surface-variant">
          {TOURNAMENT_NAME}
        </span>
      </div>

      {status === "offline" ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-xl text-center">
          <p className="text-body-lg text-on-surface mb-sm">
            {t("serviceOffline")}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {t("historyOfflineHint")}
          </p>
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg p-xl text-center text-body-sm text-on-surface-variant">
          {t("noPredictions")}
        </div>
      ) : (
        <>
          {filter !== null && (
            <div className="flex items-center justify-between gap-md mb-md">
              <span className="text-body-sm text-on-surface-variant">
                {t("filteredBy", { category: t(filter) })}
              </span>
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="text-label-caps uppercase text-primary hover:underline"
              >
                {t("allResults")}
              </button>
            </div>
          )}

          <div className="md:hidden flex gap-sm mb-md">
            <button
              type="button"
              onClick={() => handleSort("points")}
              aria-pressed={sort?.key === "points"}
              className={`flex-1 px-md py-sm border text-label-caps uppercase transition-colors ${
                sort?.key === "points"
                  ? "border-primary text-primary bg-surface-container-high"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              {t("sortByPoints")}
              {sortIndicator(sort, "points")}
            </button>
            <button
              type="button"
              onClick={() => handleSort("date")}
              aria-pressed={sort?.key === "date"}
              className={`flex-1 px-md py-sm border text-label-caps uppercase transition-colors ${
                sort?.key === "date"
                  ? "border-primary text-primary bg-surface-container-high"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              {t("sortByDate")}
              {sortIndicator(sort, "date")}
            </button>
          </div>

          {total === 0 ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-xl text-center text-body-sm text-on-surface-variant">
              {t("noPredictions")}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-hidden border border-outline-variant">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high text-label-caps uppercase text-on-surface-variant border-b border-outline-variant">
                      <th className="px-lg py-md">
                        <button
                          type="button"
                          onClick={() => handleSort("date")}
                          aria-pressed={sort?.key === "date"}
                          className="uppercase hover:text-on-surface transition-colors"
                        >
                          {t("match")}
                          {sortIndicator(sort, "date")}
                        </button>
                      </th>
                      <th className="px-lg py-md text-center">
                        {t("prediction")}
                      </th>
                      <th className="px-lg py-md text-center">{t("result")}</th>
                      <th className="px-lg py-md text-right">
                        <button
                          type="button"
                          onClick={() => handleSort("points")}
                          aria-pressed={sort?.key === "points"}
                          className="uppercase hover:text-on-surface transition-colors"
                        >
                          {t("points")}
                          {sortIndicator(sort, "points")}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {pageTips.map((tip) => {
                      const points = tip.score;
                      const toneClass = scoreToneClass(scoreColor(points));
                      const matchDate = parseDate(tip.date);
                      return (
                        <tr
                          key={tip.match_id}
                          className="bg-surface hover:bg-surface-container-lowest transition-colors"
                        >
                          <td className="px-lg py-lg">
                            <Link
                              href={`/match/${tip.match_id}`}
                              className="flex flex-col hover:underline"
                            >
                              <span className="text-body-lg font-bold text-on-background">
                                {tip.team1.tla} vs {tip.team2.tla}
                              </span>
                              <span className="text-label-caps uppercase text-on-surface-variant font-mono">
                                {formatDate(matchDate, locale)}
                              </span>
                            </Link>
                          </td>
                          <td className="px-lg py-lg text-center">
                            <span className="bg-surface-container-highest px-md py-xs rounded-sm font-mono text-data-mono text-on-background border border-outline-variant">
                              {formatScorePair(tip.tip_home, tip.tip_away)}
                            </span>
                          </td>
                          <td className="px-lg py-lg text-center">
                            <span className="bg-surface-variant text-on-surface px-md py-xs rounded-sm font-mono text-data-mono">
                              {formatScorePair(tip.score_home, tip.score_away)}
                            </span>
                          </td>
                          <td className="px-lg py-lg text-right">
                            <span
                              className={`text-headline-md font-mono font-bold ${toneClass}`}
                            >
                              {formatPoints(points)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="md:hidden border border-outline-variant divide-y divide-outline-variant">
                {pageTips.map((tip) => {
                  const points = tip.score;
                  const toneClass = scoreToneClass(scoreColor(points));
                  const matchDate = parseDate(tip.date);
                  return (
                    <li key={tip.match_id} className="bg-surface">
                      <Link
                        href={`/match/${tip.match_id}`}
                        className="block p-md hover:bg-surface-container-lowest transition-colors"
                      >
                        <div className="flex justify-between items-start gap-md mb-sm">
                          <div className="flex flex-col min-w-0">
                            <span className="text-body-lg font-bold text-on-background">
                              {tip.team1.tla} vs {tip.team2.tla}
                            </span>
                            <span className="text-label-caps uppercase text-on-surface-variant font-mono">
                              {formatDate(matchDate, locale)}
                            </span>
                          </div>
                          <span
                            className={`text-headline-md font-mono font-bold shrink-0 ${toneClass}`}
                          >
                            {formatPoints(points)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-sm">
                          <div className="flex flex-col items-start">
                            <span className="text-label-caps uppercase text-on-surface-variant">
                              {t("prediction")}
                            </span>
                            <span className="bg-surface-container-highest px-md py-xs rounded-sm font-mono text-data-mono text-on-background border border-outline-variant">
                              {formatScorePair(tip.tip_home, tip.tip_away)}
                            </span>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-label-caps uppercase text-on-surface-variant">
                              {t("result")}
                            </span>
                            <span className="bg-surface-variant text-on-surface px-md py-xs rounded-sm font-mono text-data-mono">
                              {formatScorePair(tip.score_home, tip.score_away)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {paginated && (
                <div className="flex items-center justify-between gap-md mt-lg">
                  <span className="text-body-sm text-on-surface-variant">
                    {t("showingCount", {
                      shown: pageTips.length,
                      total,
                    })}
                  </span>
                  <div className="flex items-center gap-md">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="px-md py-sm border border-outline-variant text-label-caps uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("previous")}
                    </button>
                    <span className="text-label-caps uppercase text-on-surface-variant font-mono">
                      {t("pageOf", { current: currentPage, total: pages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(pages, currentPage + 1))}
                      disabled={currentPage >= pages}
                      className="px-md py-sm border border-outline-variant text-label-caps uppercase text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t("next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
