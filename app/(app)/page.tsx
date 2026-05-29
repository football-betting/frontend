import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getLiveMatches, getUpcomingMatches } from "@/lib/match";
import { getTipByUserAndMatchIds, type TipRow } from "@/lib/tip";
import { fetchApi } from "@/lib/api";
import { RatingResponseSchema, type RatingResponse } from "@/lib/rating";
import { LiveBlock } from "@/components/dashboard/LiveBlock";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import { RankingSidebar } from "@/components/dashboard/RankingSidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { PageBackground } from "@/components/PageBackground";

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

  const [liveMatches, upcomingMatches, rating] = await Promise.all([
    getLiveMatches(),
    getUpcomingMatches(),
    loadRating(),
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

  return (
    <>
      <PageBackground src="/img/bg1.png" />
      <TopAppBar active="dashboard" />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto grid grid-cols-12 gap-lg">
        <div className="col-span-12 md:col-span-8 space-y-lg">
          <LiveBlock matches={liveMatches} tipsByMatchId={tipsByMatchId} />
          <UpcomingList
            matches={upcomingMatches}
            tipsByMatchId={tipsByMatchId}
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <RankingSidebar rating={rating} currentUserId={userId} />
        </div>
      </main>
      <BottomNav active="dashboard" />
    </>
  );
}
