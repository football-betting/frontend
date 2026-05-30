import type { MatchRow as MatchRowData } from "@/lib/match";
import type { TipRow } from "@/lib/tip";
import { Flag } from "@/components/dashboard/Flag";
import { TipForm } from "@/components/dashboard/TipForm";
import { extractTime } from "@/lib/format";

interface MatchRowProps {
  match: MatchRowData;
  tip?: TipRow;
}

export function MatchRow({ match, tip }: MatchRowProps): React.ReactElement {
  const now = new Date();
  const disabled =
    match.utcDate.getTime() < now.getTime() ||
    match.homeScore !== null ||
    match.awayScore !== null;

  return (
    <div
      className={`bg-surface-container border border-outline-variant rounded-lg p-lg transition-all ${
        disabled
          ? "opacity-60"
          : "hover:border-primary/30 focus-within:border-outline"
      }`}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-md">
        <div className="flex items-center gap-lg flex-1">
          <div className="flex items-center gap-md w-32">
            <Flag
              tla={match.homeTeam.tla}
              name={match.homeTeam.name}
            />
            <span className="text-body-lg font-bold">
              {match.homeTeam.tla}
            </span>
          </div>
          <div className="text-data-mono font-mono text-on-surface-variant">
            {extractTime(match.utcDate)}
          </div>
          <div className="flex items-center gap-md w-32 justify-end">
            <span className="text-body-lg font-bold">
              {match.awayTeam.tla}
            </span>
            <Flag
              tla={match.awayTeam.tla}
              name={match.awayTeam.name}
            />
          </div>
        </div>
        <TipForm
          matchId={match.id}
          initialTip={
            tip ? { scoreHome: tip.scoreHome, scoreAway: tip.scoreAway } : null
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}
