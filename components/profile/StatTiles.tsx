import { useTranslations } from "next-intl";

interface StatTilesProps {
  exact: number | null;
  diff: number | null;
  wins: number | null;
  bonus: number | null;
}

const TILES: {
  key: keyof StatTilesProps;
  labelKey: "exact" | "diff" | "wins" | "bonus";
}[] = [
  { key: "exact", labelKey: "exact" },
  { key: "diff", labelKey: "diff" },
  { key: "wins", labelKey: "wins" },
  { key: "bonus", labelKey: "bonus" },
];

function display(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

export function StatTiles(props: StatTilesProps): React.ReactElement {
  const t = useTranslations("Profile");
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className="p-md border border-outline-variant bg-surface-container-low"
        >
          <span className="text-label-caps uppercase text-on-surface-variant block">
            {t(tile.labelKey)}
          </span>
          <span className="text-headline-md font-mono text-on-background">
            {display(props[tile.key])}
          </span>
        </div>
      ))}
    </div>
  );
}
