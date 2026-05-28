import Link from "next/link";
import type { RatingMatchInfo } from "@/lib/rating";
import { formatDate } from "@/lib/format";
import { scoreColor, scoreToneClass } from "@/lib/scoring";
import { TOURNAMENT_NAME } from "@/lib/data/tournament";

type HistoryStatus = "ok" | "offline";

interface PredictionHistoryProps {
  status: HistoryStatus;
  tips: RatingMatchInfo[];
}

function clampPerMatchPoints(score: number): number {
  if (score === 4) return 4;
  if (score === 2) return 2;
  if (score === 1) return 1;
  return 0;
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

export function PredictionHistory({
  status,
  tips,
}: PredictionHistoryProps): React.ReactElement {
  return (
    <section className="mt-xl">
      <div className="flex justify-between items-end border-b border-outline-variant pb-md mb-lg">
        <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-background">
          Prediction History
        </h2>
        <span className="text-label-caps uppercase text-on-surface-variant">
          {TOURNAMENT_NAME}
        </span>
      </div>

      {status === "offline" ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center">
          <p className="text-body-lg text-on-surface mb-sm">Service offline</p>
          <p className="text-body-sm text-on-surface-variant">
            Prediction history will appear once the Rust service is up.
          </p>
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center text-body-sm text-on-surface-variant">
          No predictions yet
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-hidden border border-outline-variant">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high text-label-caps uppercase text-on-surface-variant border-b border-outline-variant">
                  <th className="px-lg py-md">Match</th>
                  <th className="px-lg py-md text-center">Prediction</th>
                  <th className="px-lg py-md text-center">Result</th>
                  <th className="px-lg py-md text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {tips.map((t) => {
                  const points = clampPerMatchPoints(t.score);
                  const toneClass = scoreToneClass(scoreColor(points));
                  const matchDate = parseDate(t.date);
                  return (
                    <tr
                      key={t.match_id}
                      className="bg-surface hover:bg-surface-container-lowest transition-colors"
                    >
                      <td className="px-lg py-lg">
                        <Link
                          href={`/match/${t.match_id}`}
                          className="flex flex-col hover:underline"
                        >
                          <span className="text-body-lg font-bold text-on-background">
                            {t.team1.tla} vs {t.team2.tla}
                          </span>
                          <span className="text-label-caps uppercase text-on-surface-variant font-mono">
                            {formatDate(matchDate)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-lg py-lg text-center">
                        <span className="bg-surface-container-highest px-md py-xs rounded-sm font-mono text-data-mono text-on-background border border-outline-variant">
                          {formatScorePair(t.tip_home, t.tip_away)}
                        </span>
                      </td>
                      <td className="px-lg py-lg text-center">
                        <span className="bg-surface-variant text-on-surface px-md py-xs rounded-sm font-mono text-data-mono">
                          {formatScorePair(t.score_home, t.score_away)}
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
            {tips.map((t) => {
              const points = clampPerMatchPoints(t.score);
              const toneClass = scoreToneClass(scoreColor(points));
              const matchDate = parseDate(t.date);
              return (
                <li key={t.match_id} className="bg-surface">
                  <Link
                    href={`/match/${t.match_id}`}
                    className="block p-md hover:bg-surface-container-lowest transition-colors"
                  >
                    <div className="flex justify-between items-start gap-md mb-sm">
                      <div className="flex flex-col min-w-0">
                        <span className="text-body-lg font-bold text-on-background">
                          {t.team1.tla} vs {t.team2.tla}
                        </span>
                        <span className="text-label-caps uppercase text-on-surface-variant font-mono">
                          {formatDate(matchDate)}
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
                          Prediction
                        </span>
                        <span className="bg-surface-container-highest px-md py-xs rounded-sm font-mono text-data-mono text-on-background border border-outline-variant">
                          {formatScorePair(t.tip_home, t.tip_away)}
                        </span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-label-caps uppercase text-on-surface-variant">
                          Result
                        </span>
                        <span className="bg-surface-variant text-on-surface px-md py-xs rounded-sm font-mono text-data-mono">
                          {formatScorePair(t.score_home, t.score_away)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
