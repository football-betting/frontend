import { useTranslations } from "next-intl";
import type { MatchRow as MatchRowData } from "@/lib/match";
import type { TipRow } from "@/lib/tip";
import { MatchRow } from "@/components/dashboard/MatchRow";
import { groupByDate } from "@/lib/match";
import { formatDate } from "@/lib/format";

interface UpcomingListProps {
  matches: MatchRowData[];
  tipsByMatchId: Map<number, TipRow>;
}

export function UpcomingList({
  matches,
  tipsByMatchId,
}: UpcomingListProps): React.ReactElement {
  const t = useTranslations("Dashboard");
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

  const grouped = groupByDate(matches);
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
          const heading = formatDate(dayMatches[0]!.utcDate);
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
    </section>
  );
}
