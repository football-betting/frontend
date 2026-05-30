import { useTranslations } from "next-intl";

const ROWS: {
  labelKey:
    | "exactScore"
    | "goalDifference"
    | "correctOutcome"
    | "drawCorrect"
    | "tournamentWinner"
    | "secretWinner";
  valueKey:
    | "exactScoreValue"
    | "goalDifferenceValue"
    | "correctOutcomeValue"
    | "drawCorrectValue"
    | "tournamentWinnerValue"
    | "secretWinnerValue";
}[] = [
  { labelKey: "exactScore", valueKey: "exactScoreValue" },
  { labelKey: "goalDifference", valueKey: "goalDifferenceValue" },
  { labelKey: "correctOutcome", valueKey: "correctOutcomeValue" },
  { labelKey: "drawCorrect", valueKey: "drawCorrectValue" },
  { labelKey: "tournamentWinner", valueKey: "tournamentWinnerValue" },
  { labelKey: "secretWinner", valueKey: "secretWinnerValue" },
];

export function ScoringInfobox(): React.ReactElement {
  const t = useTranslations("Scoring");
  return (
    <aside className="bg-surface-container border border-outline-variant p-lg rounded-lg">
      <div className="flex items-center gap-sm mb-md text-primary">
        <span className="material-symbols-outlined">info</span>
        <h3 className="text-label-caps uppercase">{t("title")}</h3>
      </div>
      <ul className="space-y-sm text-body-sm text-on-surface-variant">
        {ROWS.map((row) => (
          <li key={row.labelKey} className="flex justify-between gap-md">
            <span>{t(row.labelKey)}</span>
            <span className="font-mono text-on-surface whitespace-nowrap">
              {t(row.valueKey)}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
