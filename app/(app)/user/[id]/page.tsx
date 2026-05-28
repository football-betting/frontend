import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { getUserById } from "@/lib/user";
import { fetchApi } from "@/lib/api";
import { RatingUserSchema, type RatingUser } from "@/lib/rating";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatTiles } from "@/components/profile/StatTiles";
import { WinnerCards } from "@/components/profile/WinnerCards";
import { PredictionHistory } from "@/components/profile/PredictionHistory";
import { isTournamentLocked } from "@/lib/tournament";

interface UserPageProps {
  params: Promise<{ id: string }>;
}

type RatingLoad = { status: "ok"; data: RatingUser } | { status: "offline" };

async function loadUserRating(id: number): Promise<RatingLoad> {
  try {
    const data = await fetchApi(`user/${id}`, {
      wrappedByKey: "data",
      schema: RatingUserSchema,
    });
    return { status: "ok", data };
  } catch (error) {
    console.error("[profile] user rating API offline:", error);
    return { status: "offline" };
  }
}

export default async function UserProfilePage({
  params,
}: UserPageProps): Promise<React.ReactElement> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) {
    throw new Error("Profile rendered without a session — auth guard failed");
  }

  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) {
    notFound();
  }
  const userId = Number(rawId);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    notFound();
  }

  const localUser = await getUserById(userId);
  if (!localUser) {
    notFound();
  }

  const ratingLoad = await loadUserRating(userId);

  const position = ratingLoad.status === "ok" ? ratingLoad.data.position : null;
  const totalPoints =
    ratingLoad.status === "ok" ? ratingLoad.data.score_sum : null;
  const exact =
    ratingLoad.status === "ok" ? ratingLoad.data.sum_win_exact : null;
  const diff =
    ratingLoad.status === "ok" ? ratingLoad.data.sum_score_diff : null;
  const wins = ratingLoad.status === "ok" ? ratingLoad.data.sum_team : null;
  const bonus = ratingLoad.status === "ok" ? ratingLoad.data.extra_point : null;
  const tips = ratingLoad.status === "ok" ? ratingLoad.data.tips : [];

  const isOwnProfile = Number(sessionUser.id) === userId;
  const locked = await isTournamentLocked();
  const editable = isOwnProfile && !locked;

  return (
    <>
      <TopAppBar active={isOwnProfile ? "profile" : "dashboard"} />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-xl">
          <div className="md:col-span-8 flex flex-col justify-between">
            <ProfileHeader
              username={localUser.username}
              position={position}
              totalPoints={totalPoints}
            />
            <StatTiles exact={exact} diff={diff} wins={wins} bonus={bonus} />
          </div>
          <div className="md:col-span-4">
            <WinnerCards
              winner={localUser.winner}
              secretWinner={localUser.secretWinner}
              userId={userId}
              editable={editable}
            />
          </div>
        </div>

        <PredictionHistory status={ratingLoad.status} tips={tips} />
      </main>
      <BottomNav active={isOwnProfile ? "profile" : "dashboard"} />
    </>
  );
}
