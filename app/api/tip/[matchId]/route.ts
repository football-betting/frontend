import { getCurrentSession } from "@/lib/session";
import { getMatchById } from "@/lib/match";
import { saveTip } from "@/lib/tip";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
): Promise<Response> {
  const { user } = await getCurrentSession();
  if (!user) {
    return jsonError("notLoggedIn", 401);
  }

  const userId = Number(user.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return jsonError("notLoggedIn", 401);
  }

  const { matchId: rawMatchId } = await params;
  const matchId = Number.parseInt(rawMatchId, 10);
  if (!Number.isFinite(matchId) || matchId <= 0) {
    return jsonError("matchNotFound", 400);
  }

  const matchRow = await getMatchById(matchId);
  if (!matchRow) {
    return jsonError("matchNotFound", 400);
  }

  const now = new Date();
  if (
    matchRow.utcDate.getTime() < now.getTime() ||
    matchRow.homeScore !== null ||
    matchRow.awayScore !== null
  ) {
    return jsonError("matchStartedOrFinished", 400);
  }

  const formData = await request.formData();
  const rawTip1 = formData.get("tip1");
  const rawTip2 = formData.get("tip2");

  const tip1 = Number.parseInt(
    typeof rawTip1 === "string" ? rawTip1 : "",
    10,
  );
  const tip2 = Number.parseInt(
    typeof rawTip2 === "string" ? rawTip2 : "",
    10,
  );

  if (
    !Number.isFinite(tip1) ||
    tip1 < 0 ||
    tip1 > 20 ||
    !Number.isFinite(tip2) ||
    tip2 < 0 ||
    tip2 > 20
  ) {
    return jsonError("tipOutOfRange", 400);
  }

  try {
    const saved = await saveTip(userId, matchId, tip1, tip2);
    return new Response(
      JSON.stringify({
        success: true,
        tip: {
          id: saved.id,
          userId: saved.userId,
          matchId: saved.matchId,
          scoreHome: saved.scoreHome,
          scoreAway: saved.scoreAway,
          date: saved.date instanceof Date ? saved.date.getTime() : saved.date,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[tip] save failed", error);
    return jsonError("failedToSave", 500);
  }
}
