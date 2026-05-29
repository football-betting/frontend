import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Profile");
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
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center">
          <p className="text-body-lg text-on-surface mb-sm">
            {t("serviceOffline")}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {t("historyOfflineHint")}
          </p>
        </div>
      ) : tips.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center text-body-sm text-on-surface-variant">
          {t("noPredictions")}
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-hidden border border-outline-variant">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high text-label-caps uppercase text-on-surface-variant border-b border-outline-variant">
                  <th className="px-lg py-md">{t("match")}</th>
                  <th className="px-lg py-md text-center">{t("prediction")}</th>
                  <th className="px-lg py-md text-center">{t("result")}</th>
                  <th className="px-lg py-md text-right">{t("points")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {tips.map((tip) => {
                  const points = clampPerMatchPoints(tip.score);
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
                            {formatDate(matchDate)}
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
            {tips.map((tip) => {
              const points = clampPerMatchPoints(tip.score);
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
        </>
      )}
    </section>
  );
}
