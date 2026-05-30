import { useTranslations } from "next-intl";

interface ProfileHeaderProps {
  username: string;
  displayName: string;
  position: number | null;
  totalPoints: number | null;
}

function formatRank(position: number | null): string {
  if (position === null) return "—";
  return `#${position}`;
}

function formatPoints(points: number | null): string {
  if (points === null) return "—";
  return points.toLocaleString("de-DE");
}

export function ProfileHeader({
  username,
  displayName,
  position,
  totalPoints,
}: ProfileHeaderProps): React.ReactElement {
  const t = useTranslations("Profile");
  return (
    <div>
      <h1
        className={`text-headline-lg-mobile md:text-headline-lg text-on-background${
          displayName ? "" : " mb-sm"
        }`}
      >
        {username}
      </h1>
      {displayName ? (
        <p className="text-body-lg text-on-surface-variant opacity-70 mb-sm">
          {displayName}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-md items-center mt-md">
        <div className="bg-surface-container px-lg py-md border border-outline-variant">
          <span className="text-label-caps uppercase text-on-surface-variant block mb-xs">
            {t("globalRanking")}
          </span>
          <span className="text-display font-mono text-primary tracking-tighter">
            {formatRank(position)}
          </span>
        </div>
        <div className="bg-surface-container px-lg py-md border border-outline-variant">
          <span className="text-label-caps uppercase text-on-surface-variant block mb-xs">
            {t("totalPoints")}
          </span>
          <span className="text-display font-mono text-tertiary tracking-tighter">
            {formatPoints(totalPoints)}
          </span>
        </div>
      </div>
    </div>
  );
}
