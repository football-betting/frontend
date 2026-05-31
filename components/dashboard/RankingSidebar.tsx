import Link from "next/link";
import { useTranslations } from "next-intl";
import type { RatingResponse, RatingUser } from "@/lib/rating";
import { sliceGlobalShortTable } from "@/lib/rating";
import { abbreviateUsername } from "@/lib/format";
import { TabBar } from "@/components/dashboard/TabBar";
import { DEPARTMENTS, displayDepartment } from "@/lib/data/departments";
import { Avatar } from "@/components/Avatar";
import type { UserAvatarInfo } from "@/lib/user";

type AvatarMap = Map<number, UserAvatarInfo>;

interface RankingSidebarProps {
  rating: RatingResponse | null;
  currentUserId: number;
  avatarsById: AvatarMap;
}

function RankingRow({
  user,
  isCurrent,
  avatarInfo,
  showDivider = false,
}: {
  user?: RatingUser;
  isCurrent?: boolean;
  avatarInfo?: UserAvatarInfo;
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
        <Avatar
          avatarPath={avatarInfo?.avatar ?? null}
          email={avatarInfo?.email ?? ""}
          name={user.name}
          size={32}
          className={isCurrent ? "ring-2 ring-primary shrink-0" : "shrink-0"}
        />
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
  avatarsById,
}: {
  rating: RatingResponse;
  currentUserId: number;
  avatarsById: AvatarMap;
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
          avatarInfo={avatarsById.get(u.user_id)}
        />
      ))}
      {hasGap ? <RankingRow showDivider /> : null}
      {neighborRows.map((u) => (
        <RankingRow
          key={u.user_id}
          user={u}
          isCurrent={u.user_id === currentUserId}
          avatarInfo={avatarsById.get(u.user_id)}
        />
      ))}
    </div>
  );
}

function DepartmentPanel({
  users,
  currentUserId,
  avatarsById,
}: {
  users: RatingUser[];
  currentUserId: number;
  avatarsById: AvatarMap;
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
          avatarInfo={avatarsById.get(u.user_id)}
        />
      ))}
    </div>
  );
}

export function RankingSidebar({
  rating,
  currentUserId,
  avatarsById,
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
    global: (
      <GlobalPanel
        rating={rating}
        currentUserId={currentUserId}
        avatarsById={avatarsById}
      />
    ),
  };
  for (const dept of DEPARTMENTS) {
    panels[dept] = (
      <DepartmentPanel
        users={rating.departments[dept] ?? []}
        currentUserId={currentUserId}
        avatarsById={avatarsById}
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
