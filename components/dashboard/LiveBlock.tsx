import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MatchRow } from "@/lib/match";
import type { TipRow } from "@/lib/tip";
import { Flag } from "@/components/dashboard/Flag";
import { computeScore } from "@/lib/score";
import { scoreColor, scoreToneClass } from "@/lib/scoring";

export function LiveBlock({
  matches,
  tipsByMatchId,
}: {
  matches: MatchRow[];
  tipsByMatchId: Map<number, TipRow>;
}): React.ReactElement | null {
  const t = useTranslations("Dashboard");
  const rows = matches
    .map((m) => {
      const tip = tipsByMatchId.get(m.id);
      if (!tip) return null;
      const points =
        m.homeScore !== null && m.awayScore !== null
          ? computeScore(tip.scoreHome, tip.scoreAway, m.homeScore, m.awayScore)
          : null;
      return { match: m, tip, points };
    })
    .filter((r): r is { match: MatchRow; tip: TipRow; points: number | null } => r !== null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-sm mb-md">
        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
        <h2 className="text-label-caps uppercase text-primary tracking-widest">
          {t("liveNow")}
        </h2>
      </div>
      <div className="space-y-md">
        {rows.map(({ match, tip, points }) => {
          const tone = points !== null ? scoreColor(points) : "neutral";
          const toneClass = scoreToneClass(tone);
          return (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="block bg-surface-container border border-outline-variant rounded-lg p-lg relative overflow-hidden group hover:border-primary/40 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-center gap-sm w-1/3">
                  <Flag
                    tla={match.homeTeam.tla}
                    name={match.homeTeam.name}
                    className="w-12 h-8 object-cover rounded-sm shadow-md"
                  />
                  <span className="text-label-caps uppercase">
                    {match.homeTeam.name}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-xs">
                  <div className="text-display font-mono leading-none flex gap-md">
                    <span>{match.homeScore ?? "-"}</span>
                    <span className="text-outline-variant">:</span>
                    <span>{match.awayScore ?? "-"}</span>
                  </div>
                  <span className="text-label-caps uppercase text-primary-container">
                    {t("live")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-sm w-1/3">
                  <Flag
                    tla={match.awayTeam.tla}
                    name={match.awayTeam.name}
                    className="w-12 h-8 object-cover rounded-sm shadow-md"
                  />
                  <span className="text-label-caps uppercase">
                    {match.awayTeam.name}
                  </span>
                </div>
              </div>
              <div className="mt-lg pt-md border-t border-outline-variant flex justify-between items-center">
                <div className="flex items-center gap-md">
                  <span className="text-label-caps uppercase text-on-surface-variant">
                    {t("yourTip")}
                  </span>
                  <span className="font-mono text-data-mono bg-surface-container-highest px-md py-xs rounded">
                    {tip.scoreHome} : {tip.scoreAway}
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-label-caps uppercase text-on-surface-variant">
                    {t("points")}
                  </span>
                  <span
                    className={`text-headline-md font-bold tracking-tighter ${toneClass}`}
                  >
                    {points === null ? "–" : `${points > 0 ? "+" : ""}${points}`}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
