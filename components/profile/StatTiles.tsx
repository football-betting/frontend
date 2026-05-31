"use client";

import { useTranslations } from "next-intl";
import type { HistoryFilter } from "@/lib/history";
import { useHistoryFilter } from "@/components/profile/HistoryFilterContext";

interface StatTilesProps {
  exact: number | null;
  diff: number | null;
  wins: number | null;
  bonus: number | null;
}

const FILTER_TILES: {
  key: "exact" | "diff" | "wins";
  filter: HistoryFilter;
}[] = [
  { key: "exact", filter: "exact" },
  { key: "diff", filter: "diff" },
  { key: "wins", filter: "wins" },
];

function display(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

export function StatTiles(props: StatTilesProps): React.ReactElement {
  const t = useTranslations("Profile");
  const { filter, toggleFilter } = useHistoryFilter();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
      {FILTER_TILES.map((tile) => {
        const active = filter === tile.filter;
        return (
          <button
            key={tile.key}
            type="button"
            onClick={() => toggleFilter(tile.filter)}
            aria-pressed={active}
            className={`p-md border text-left transition-colors hover:bg-surface-container-high ${
              active
                ? "border-primary ring-2 ring-primary bg-surface-container-high"
                : "border-outline-variant bg-surface-container-low"
            }`}
          >
            <span className="text-label-caps uppercase text-on-surface-variant block">
              {t(tile.key)}
            </span>
            <span className="text-headline-md font-mono text-on-background">
              {display(props[tile.key])}
            </span>
          </button>
        );
      })}
      <div className="p-md border border-outline-variant bg-surface-container-low">
        <span className="text-label-caps uppercase text-on-surface-variant block">
          {t("bonus")}
        </span>
        <span className="text-headline-md font-mono text-on-background">
          {display(props.bonus)}
        </span>
      </div>
    </div>
  );
}
