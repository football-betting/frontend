"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { MatchRow as MatchRowData } from "@/lib/match";
import type { TipRow } from "@/lib/tip";
import { MatchRow } from "@/components/dashboard/MatchRow";
import { formatDate, formatDateKey } from "@/lib/format";

interface UpcomingListProps {
  matches: MatchRowData[];
  tipsByMatchId: Map<number, TipRow>;
}

function groupByDate(
  matches: MatchRowData[],
): Record<string, MatchRowData[]> {
  const groups: Record<string, MatchRowData[]> = {};
  for (const m of matches) {
    const key = formatDateKey(m.utcDate);
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(m);
  }
  return groups;
}

const PAGINATE_THRESHOLD = 30;
const INITIAL_VISIBLE = 20;
const LOAD_STEP = 10;

export function UpcomingList({
  matches,
  tipsByMatchId,
}: UpcomingListProps): React.ReactElement {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const paginated = matches.length > PAGINATE_THRESHOLD;
  const [visibleCount, setVisibleCount] = useState(
    paginated ? INITIAL_VISIBLE : matches.length,
  );

  if (matches.length === 0) {
    return (
      <section>
        <h2 className="text-label-caps uppercase text-on-surface-variant mb-md tracking-widest">
          {t("upcomingFixtures")}
        </h2>
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg text-on-surface-variant">
          {t("noUpcomingFixtures")}
        </div>
      </section>
    );
  }

  const ordered = paginated
    ? [...matches].sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime())
    : matches;
  const visibleMatches = paginated
    ? ordered.slice(0, visibleCount)
    : ordered;
  const hiddenCount = matches.length - visibleMatches.length;
  const showLoadAll = hiddenCount > LOAD_STEP;

  const grouped = groupByDate(visibleMatches);
  const dateKeys = Object.keys(grouped).sort();

  return (
    <section>
      <h2 className="text-label-caps uppercase text-on-surface-variant mb-md tracking-widest">
        {t("upcomingFixtures")}
      </h2>
      <div className="space-y-lg">
        {dateKeys.map((key) => {
          const dayMatches = grouped[key];
          if (!dayMatches || dayMatches.length === 0) return null;
          const heading = formatDate(dayMatches[0]!.utcDate, locale);
          return (
            <div key={key} className="space-y-sm">
              <div className="text-label-caps uppercase text-on-surface-variant/60 px-xs">
                {heading}
              </div>
              {dayMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  tip={tipsByMatchId.get(m.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 ? (
        <div className="flex flex-wrap gap-sm justify-center mt-lg">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((c) => Math.min(c + LOAD_STEP, matches.length))
            }
            className="text-label-caps uppercase px-lg py-sm rounded-lg border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
          >
            {t("loadNext", { count: LOAD_STEP })}
          </button>
          {showLoadAll ? (
            <button
              type="button"
              onClick={() => setVisibleCount(matches.length)}
              className="text-label-caps uppercase px-lg py-sm rounded-lg border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              {t("loadAll")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
