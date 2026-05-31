import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getLiveMatches, getUpcomingMatches, getLiveState } from "@/lib/match";
import { getTipByUserAndMatchIds, type TipRow } from "@/lib/tip";
import { getUserAvatarsByIds } from "@/lib/user";
import { fetchApi } from "@/lib/api";
import { RatingResponseSchema, type RatingResponse } from "@/lib/rating";
import { LiveBlock } from "@/components/dashboard/LiveBlock";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import { RankingSidebar } from "@/components/dashboard/RankingSidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { LiveRefresher } from "@/components/dashboard/LiveRefresher";

async function loadRating(): Promise<RatingResponse | null> {
  try {
    return await fetchApi("rating", {
      wrappedByKey: "table",
      schema: RatingResponseSchema,
    });
  } catch (error) {
    console.error("[dashboard] rating API offline:", error);
    return null;
  }
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  const userId = Number(user.id);

  const [liveMatches, upcomingMatches, rating, liveState] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(),
    loadRating(),
    getLiveState(),
  ]);

  const allMatchIds = [
    ...liveMatches.map((m) => m.id),
    ...upcomingMatches.map((m) => m.id),
  ];
  const tips = await getTipByUserAndMatchIds(userId, allMatchIds);

  const tipsByMatchId = new Map<number, TipRow>();
  for (const t of tips) {
    if (t.matchId !== null && t.matchId !== undefined) {
      tipsByMatchId.set(t.matchId, t);
    }
  }

  const rankedUserIds = rating
    ? [
        ...rating.global.map((u) => u.user_id),
        ...Object.values(rating.departments).flatMap((list) =>
          list.map((u) => u.user_id),
        ),
      ]
    : [];
  const avatarsById = await getUserAvatarsByIds([...new Set(rankedUserIds)]);

  return (
    <>
      <TopAppBar active="dashboard" />
      <LiveRefresher
        isLive={liveState.isLive}
        nextKickoff={liveState.nextKickoff}
      />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto grid grid-cols-12 gap-lg">
        <div className="col-span-12 min-[980px]:col-span-8 space-y-lg">
          <LiveBlock matches={liveMatches} tipsByMatchId={tipsByMatchId} />
          {/* Below 980px: ranking sits between live and upcoming fixtures */}
          <div className="min-[980px]:hidden">
            <RankingSidebar
              rating={rating}
              currentUserId={userId}
              avatarsById={avatarsById}
            />
          </div>
          <UpcomingList
            matches={upcomingMatches}
            tipsByMatchId={tipsByMatchId}
          />
        </div>
        {/* From 980px: ranking as the right sidebar */}
        <div className="hidden min-[980px]:block col-span-12 min-[980px]:col-span-4">
          <RankingSidebar
            rating={rating}
            currentUserId={userId}
            avatarsById={avatarsById}
          />
        </div>
      </main>
      <BottomNav active="dashboard" />
    </>
  );
}
