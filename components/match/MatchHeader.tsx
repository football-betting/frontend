import { useTranslations } from "next-intl";
import type { MatchRow } from "@/lib/match";
import { Flag } from "@/components/dashboard/Flag";
import { extractTime, formatDate } from "@/lib/format";

interface MatchHeaderProps {
  match: MatchRow;
  liveMinute?: number | null;
}

type Status = "LIVE" | "FINISHED" | "SCHEDULED";

function resolveStatus(raw: string): Status {
  if (raw === "IN_PLAY" || raw === "PAUSED") return "LIVE";
  if (raw === "FINISHED") return "FINISHED";
  return "SCHEDULED";
}

function hasFinalScore(match: MatchRow): boolean {
  return match.homeScore !== null && match.awayScore !== null;
}

export function MatchHeader({
  match,
  liveMinute,
}: MatchHeaderProps): React.ReactElement {
  const t = useTranslations("Match");
  const status = resolveStatus(match.status);
  const showScore = status !== "SCHEDULED" && hasFinalScore(match);

  return (
    <section className="mb-xl">
      <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--color-primary-container)_0%,_transparent_55%)] opacity-10" />
        <div className="relative z-10 p-lg md:p-xl flex flex-col items-center">
          <StatusBadge status={status} liveMinute={liveMinute} />
          <div className="flex items-center justify-between w-full max-w-4xl gap-md md:gap-lg mt-md">
            <TeamBlock
              tla={match.homeTeam.tla}
              name={match.homeTeam.name}
            />
            <div className="flex flex-col items-center min-w-0">
              {showScore ? (
                <div className="text-headline-lg md:text-display font-mono leading-none flex gap-sm md:gap-md text-primary">
                  <span>{match.homeScore}</span>
                  <span className="text-on-surface-variant">:</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : status === "SCHEDULED" ? (
                <div className="text-headline-md md:text-headline-lg font-mono text-on-surface-variant uppercase tracking-tighter">
                  {t("vs")}
                </div>
              ) : (
                <div className="text-headline-lg md:text-display font-mono leading-none flex gap-sm md:gap-md text-primary">
                  <span>?</span>
                  <span className="text-on-surface-variant">:</span>
                  <span>?</span>
                </div>
              )}
              <StatusSublabel
                status={status}
                liveMinute={liveMinute}
                kickoff={match.utcDate}
              />
            </div>
            <TeamBlock
              tla={match.awayTeam.tla}
              name={match.awayTeam.name}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamBlock({
  tla,
  name,
}: {
  tla: string;
  name: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center flex-1 min-w-0 gap-sm">
      <Flag
        tla={tla}
        name={name}
        className="w-16 h-10 md:w-20 md:h-12 object-cover rounded-sm shadow-md border border-outline-variant"
      />
      <h2 className="text-body-lg md:text-headline-md uppercase text-center font-bold truncate w-full">
        {name}
      </h2>
    </div>
  );
}

function StatusBadge({
  status,
  liveMinute,
}: {
  status: Status;
  liveMinute?: number | null;
}): React.ReactElement {
  const t = useTranslations("Match");
  if (status === "LIVE") {
    return (
      <div className="flex items-center gap-sm bg-error-container/40 border border-error/40 px-md py-1 rounded-full">
        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
        <span className="text-label-caps uppercase text-primary">
          {t("live")}
        </span>
        {typeof liveMinute === "number" ? (
          <span className="text-label-caps font-mono text-primary">
            {liveMinute}&apos;
          </span>
        ) : null}
      </div>
    );
  }

  if (status === "FINISHED") {
    return (
      <span className="bg-surface-container-highest text-on-surface px-md py-1 rounded text-label-caps uppercase border border-outline-variant">
        {t("fullTime")}
      </span>
    );
  }

  return (
    <span className="bg-surface-container-low text-on-surface-variant px-md py-1 rounded text-label-caps uppercase border border-outline-variant">
      {t("scheduled")}
    </span>
  );
}

function StatusSublabel({
  status,
  liveMinute,
  kickoff,
}: {
  status: Status;
  liveMinute?: number | null;
  kickoff: Date;
}): React.ReactElement {
  const t = useTranslations("Match");
  const kickoffLine = (
    <div className="text-label-caps uppercase text-on-surface-variant mt-xs font-mono">
      {formatDate(kickoff)} &middot; {extractTime(kickoff)}
    </div>
  );

  if (status === "LIVE") {
    return (
      <>
        <div className="text-label-caps uppercase text-on-surface-variant mt-xs">
          {typeof liveMinute === "number" ? `${liveMinute}'` : t("liveLabel")}
        </div>
        {kickoffLine}
      </>
    );
  }

  return kickoffLine;
}
