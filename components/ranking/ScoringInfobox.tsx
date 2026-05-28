interface ScoringRow {
  label: string;
  value: string;
}

const ROWS: ScoringRow[] = [
  { label: "Exact Score", value: "4 Pts" },
  { label: "Goal Difference", value: "2 Pts" },
  { label: "Correct Outcome", value: "1 Pt" },
  { label: "Tournament Winner", value: "+15 Pts (bonus)" },
  { label: "Secret Winner", value: "+7 Pts (bonus)" },
];

export function ScoringInfobox(): React.ReactElement {
  return (
    <aside className="bg-surface-container border border-outline-variant p-lg rounded-xl">
      <div className="flex items-center gap-sm mb-md text-primary">
        <span className="material-symbols-outlined">info</span>
        <h3 className="text-label-caps uppercase">Scoring System</h3>
      </div>
      <ul className="space-y-sm text-body-sm text-on-surface-variant">
        {ROWS.map((row) => (
          <li key={row.label} className="flex justify-between gap-md">
            <span>{row.label}</span>
            <span className="font-mono text-on-surface whitespace-nowrap">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
