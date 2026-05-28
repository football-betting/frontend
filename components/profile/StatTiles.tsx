interface StatTilesProps {
  exact: number | null;
  diff: number | null;
  wins: number | null;
  bonus: number | null;
}

const TILES: { key: keyof StatTilesProps; label: string }[] = [
  { key: "exact", label: "EXACT" },
  { key: "diff", label: "DIFF" },
  { key: "wins", label: "WINS" },
  { key: "bonus", label: "BONUS" },
];

function display(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

export function StatTiles(props: StatTilesProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mt-lg">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className="p-md border border-outline-variant bg-surface-container-low"
        >
          <span className="text-label-caps uppercase text-on-surface-variant block">
            {tile.label}
          </span>
          <span className="text-headline-md font-mono text-on-background">
            {display(props[tile.key])}
          </span>
        </div>
      ))}
    </div>
  );
}
