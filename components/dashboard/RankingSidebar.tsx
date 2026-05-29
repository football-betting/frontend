import Link from "next/link";
import { useTranslations } from "next-intl";
import type { RatingResponse, RatingUser } from "@/lib/rating";
import { sliceGlobalShortTable } from "@/lib/rating";
import { abbreviateUsername } from "@/lib/format";
import { TabBar } from "@/components/dashboard/TabBar";
import { DEPARTMENTS, displayDepartment } from "@/lib/data/departments";

interface RankingSidebarProps {
  rating: RatingResponse | null;
  currentUserId: number;
}

function RankingRow({
  user,
  isCurrent,
  showDivider = false,
}: {
  user?: RatingUser;
  isCurrent?: boolean;
  showDivider?: boolean;
}): React.ReactElement {
  const t = useTranslations("Common");
  if (showDivider) {
    return (
      <div className="p-xs bg-surface-container-lowest flex justify-center">
        <span className="material-symbols-outlined text-outline-variant text-[16px]">
          more_vert
        </span>
      </div>
    );
  }
  if (!user) {
    return <></>;
  }
  return (
    <Link
      href={`/user/${user.user_id}`}
      className={`p-md flex items-center justify-between group transition-colors ${
        isCurrent
          ? "bg-primary/10 border-l-4 border-primary"
          : "hover:bg-surface-container-high"
      }`}
    >
      <div className="flex items-center gap-md min-w-0">
        <span
          className={`text-data-mono font-mono w-6 text-right shrink-0 ${
            isCurrent ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {user.position}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isCurrent ? "bg-primary" : "bg-surface-container-highest"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isCurrent ? "text-on-primary" : ""
            }`}
            style={
              isCurrent ? { fontVariationSettings: "'FILL' 1" } : undefined
            }
          >
            person
          </span>
        </div>
        <span
          className={`text-body-sm font-bold truncate ${
            isCurrent ? "text-primary" : ""
          }`}
        >
          {abbreviateUsername(user.name)}
          {isCurrent ? t("youParen") : ""}
        </span>
      </div>
      <span
        className={`text-data-mono font-mono whitespace-nowrap ${
          isCurrent ? "text-primary font-bold" : "text-on-surface"
        }`}
      >
        {user.score_sum} {t("pts")}
      </span>
    </Link>
  );
}

function GlobalPanel({
  rating,
  currentUserId,
}: {
  rating: RatingResponse;
  currentUserId: number;
}): React.ReactElement {
  const t = useTranslations("Dashboard");
  const { topRows, neighborRows, hasGap } = sliceGlobalShortTable(
    rating.global,
    currentUserId,
  );

  if (topRows.length === 0) {
    return (
      <div className="p-lg text-center text-body-sm text-on-surface-variant">
        {t("noRankingData")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-outline-variant">
      {topRows.map((u) => (
        <RankingRow
          key={u.user_id}
          user={u}
          isCurrent={u.user_id === currentUserId}
        />
      ))}
      {hasGap ? <RankingRow showDivider /> : null}
      {neighborRows.map((u) => (
        <RankingRow
          key={u.user_id}
          user={u}
          isCurrent={u.user_id === currentUserId}
        />
      ))}
    </div>
  );
}

function DepartmentPanel({
  users,
  currentUserId,
}: {
  users: RatingUser[];
  currentUserId: number;
}): React.ReactElement {
  const t = useTranslations("Dashboard");
  if (users.length === 0) {
    return (
      <div className="p-lg text-center text-body-sm text-on-surface-variant">
        {t("noUsersInDepartment")}
      </div>
    );
  }
  return (
    <div className="divide-y divide-outline-variant">
      {users.map((u) => (
        <RankingRow
          key={u.user_id}
          user={u}
          isCurrent={u.user_id === currentUserId}
        />
      ))}
    </div>
  );
}

export function RankingSidebar({
  rating,
  currentUserId,
}: RankingSidebarProps): React.ReactElement {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  if (!rating) {
    return (
      <aside className="space-y-lg">
        <div className="bg-surface-container border border-outline-variant rounded-lg p-lg">
          <h3 className="text-label-caps uppercase text-on-surface mb-md">
            {t("ranking")}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {t("rankingOffline")}
          </p>
        </div>
      </aside>
    );
  }

  const tabs = [
    { id: "global", label: tCommon("global") },
    ...DEPARTMENTS.map((d) => ({ id: d, label: displayDepartment(d) })),
  ];

  const panels: Record<string, React.ReactNode> = {
    global: <GlobalPanel rating={rating} currentUserId={currentUserId} />,
  };
  for (const dept of DEPARTMENTS) {
    panels[dept] = (
      <DepartmentPanel
        users={rating.departments[dept] ?? []}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <aside className="space-y-lg">
      <div className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden">
        <TabBar tabs={tabs} initialActive="global" panels={panels} />
        <Link
          href="/ranking"
          className="block p-md text-center text-label-caps uppercase text-secondary hover:underline bg-surface-container-low transition-all"
        >
          {t("viewFullRanking")}
        </Link>
      </div>
    </aside>
  );
}
