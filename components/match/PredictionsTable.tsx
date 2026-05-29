import Link from "next/link";
import { useTranslations } from "next-intl";
import { abbreviateUsername } from "@/lib/format";
import { scoreColor, type ScoreTone } from "@/lib/scoring";

export interface PredictionRow {
  userId: number;
  username: string;
  scoreHome: number | null;
  scoreAway: number | null;
  score: number;
}

interface PredictionsTableProps {
  rows: PredictionRow[];
  currentUserId: number;
  emptyMessage: string;
}

function formatRank(rank: number): string {
  return rank < 10 ? `0${rank}` : String(rank);
}

function initials(username: string): string {
  const trimmed = username.trim();
  if (trimmed.length === 0) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function hashHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function avatarStyle(username: string): React.CSSProperties {
  const hue = hashHue(username);
  return {
    backgroundColor: `hsl(${hue} 55% 28%)`,
    color: `hsl(${hue} 90% 88%)`,
  };
}

function pillClass(tone: ScoreTone): string {
  switch (tone) {
    case "success":
      return "bg-[#1b5e20] text-white border border-green-400/30";
    case "warning":
      return "bg-[#fbc02d]/20 text-[#fbc02d] border border-[#fbc02d]/40";
    case "danger":
      return "bg-error-container/30 text-error border border-error/40";
    case "neutral":
    default:
      return "bg-surface-container-highest text-on-surface-variant border border-outline-variant";
  }
}

function formatPoints(score: number): string {
  return score > 0 ? `+${score}` : String(score);
}

function formatPrediction(home: number | null, away: number | null): string {
  const h = home === null ? "-" : String(home);
  const a = away === null ? "-" : String(away);
  return `${h} — ${a}`;
}

export function PredictionsTable({
  rows,
  currentUserId,
  emptyMessage,
}: PredictionsTableProps): React.ReactElement {
  const t = useTranslations("Match");
  const tCommon = useTranslations("Common");
  if (rows.length === 0) {
    return (
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center text-body-sm text-on-surface-variant">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant">
              <th className="px-lg py-md text-label-caps uppercase text-on-surface-variant">
                {t("rank")}
              </th>
              <th className="px-lg py-md text-label-caps uppercase text-on-surface-variant">
                {t("user")}
              </th>
              <th className="px-lg py-md text-label-caps uppercase text-on-surface-variant text-center">
                {t("predictionCol")}
              </th>
              <th className="px-lg py-md text-label-caps uppercase text-on-surface-variant text-right">
                {t("pointsCol")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((row, index) => {
              const isCurrent = row.userId === currentUserId;
              const tone = scoreColor(row.score);
              return (
                <tr
                  key={row.userId}
                  className={
                    isCurrent
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-surface-container-high transition-colors"
                  }
                >
                  <td
                    className={`px-lg py-md font-mono text-data-mono ${
                      isCurrent ? "text-primary font-bold" : ""
                    }`}
                  >
                    {formatRank(index + 1)}
                  </td>
                  <td className="px-lg py-md">
                    <Link
                      href={`/user/${row.userId}`}
                      className="flex items-center gap-md hover:underline"
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                        style={avatarStyle(row.username)}
                      >
                        {initials(row.username)}
                      </span>
                      <span
                        className={
                          isCurrent
                            ? "text-primary font-bold"
                            : "font-bold text-on-surface"
                        }
                      >
                        {abbreviateUsername(row.username)}
                      </span>
                      {isCurrent ? (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-1 rounded uppercase tracking-tighter">
                          {tCommon("you")}
                        </span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-lg py-md text-center font-mono text-headline-md tracking-widest">
                    {formatPrediction(row.scoreHome, row.scoreAway)}
                  </td>
                  <td className="px-lg py-md text-right">
                    <span
                      className={`px-4 py-1 rounded-full font-mono text-data-mono inline-block ${pillClass(
                        tone,
                      )}`}
                    >
                      {formatPoints(row.score)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden divide-y divide-outline-variant">
        {rows.map((row, index) => {
          const isCurrent = row.userId === currentUserId;
          const tone = scoreColor(row.score);
          return (
            <li
              key={row.userId}
              className={
                isCurrent
                  ? "bg-primary/10 border-l-4 border-primary p-md"
                  : "p-md"
              }
            >
              <Link
                href={`/user/${row.userId}`}
                className="flex items-center justify-between gap-md"
              >
                <div className="flex items-center gap-md min-w-0">
                  <span
                    className={`font-mono text-data-mono shrink-0 ${
                      isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {formatRank(index + 1)}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={avatarStyle(row.username)}
                  >
                    {initials(row.username)}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`truncate font-bold ${
                        isCurrent ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {abbreviateUsername(row.username)}
                      {isCurrent ? (
                        <span className="ml-sm bg-primary text-on-primary text-[10px] font-bold px-1 rounded uppercase tracking-tighter">
                          {tCommon("you")}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-data-mono text-on-surface-variant">
                      {formatPrediction(row.scoreHome, row.scoreAway)}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-mono text-data-mono shrink-0 ${pillClass(
                    tone,
                  )}`}
                >
                  {formatPoints(row.score)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
