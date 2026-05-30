import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { getMatchById } from "@/lib/match";
import { fetchApi } from "@/lib/api";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { MatchHeader } from "@/components/match/MatchHeader";
import {
  PredictionsTable,
  type PredictionRow,
} from "@/components/match/PredictionsTable";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

interface RawTip {
  user: unknown;
  user_id: unknown;
  score: unknown;
  tip_home: unknown;
  tip_away: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function parseTips(raw: unknown): PredictionRow[] | null {
  let list: unknown = raw;
  if (isRecord(list)) {
    const data = list.data;
    if (isRecord(data) && Array.isArray(data.tips)) {
      list = data.tips;
    } else if (Array.isArray(list.tips)) {
      list = list.tips;
    }
  }
  if (!Array.isArray(list)) return null;

  const rows: PredictionRow[] = [];
  for (const item of list) {
    if (!isRecord(item)) continue;
    const t = item as unknown as RawTip;
    const userId =
      typeof t.user_id === "number"
        ? t.user_id
        : typeof t.user_id === "string"
          ? Number(t.user_id)
          : NaN;
    if (!Number.isFinite(userId)) continue;
    const username = typeof t.user === "string" ? t.user : "";
    const score = typeof t.score === "number" ? t.score : 0;
    if (t.tip_home === undefined || t.tip_home === null) {
      continue;
    }
    if (t.tip_away === undefined || t.tip_away === null) {
      continue;
    }
    const tipHome =
      typeof t.tip_home === "number"
        ? t.tip_home
        : typeof t.tip_home === "string"
          ? Number(t.tip_home)
          : null;
    const tipAway =
      typeof t.tip_away === "number"
        ? t.tip_away
        : typeof t.tip_away === "string"
          ? Number(t.tip_away)
          : null;
    if (tipHome === null || tipAway === null) continue;
    if (!Number.isFinite(tipHome) || !Number.isFinite(tipAway)) continue;
    rows.push({
      userId,
      username,
      scoreHome: tipHome,
      scoreAway: tipAway,
      score,
    });
  }
  return rows;
}

type PredictionsLoad =
  | { status: "ok"; rows: PredictionRow[] }
  | { status: "offline" };

async function loadPredictions(matchId: number): Promise<PredictionsLoad> {
  try {
    const raw = await fetchApi<unknown>(`game/${matchId}`);
    const rows = parseTips(raw);
    if (rows === null) {
      return { status: "offline" };
    }
    rows.sort((a, b) => b.score - a.score);
    return { status: "ok", rows };
  } catch (error) {
    console.error("[match] predictions API offline:", error);
    return { status: "offline" };
  }
}

export default async function MatchDetailPage({
  params,
}: MatchPageProps): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  const userId = Number(user.id);

  const { id: rawId } = await params;
  if (!/^[1-9]\d*$/.test(rawId)) {
    notFound();
  }
  const matchId = Number(rawId);
  if (!Number.isSafeInteger(matchId)) {
    notFound();
  }

  const match = await getMatchById(matchId);
  if (!match) {
    notFound();
  }

  const predictions = await loadPredictions(matchId);
  const status = match.status;
  const isScheduled = status !== "IN_PLAY" && status !== "FINISHED";
  const t = await getTranslations("Match");

  return (
    <>
      <TopAppBar active="dashboard" />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <MatchHeader match={match} liveMinute={null} />

        <section>
          <div className="flex justify-between items-end mb-md">
            <h3 className="text-headline-md uppercase">
              {t("userPredictions")}
            </h3>
            <div className="text-label-caps uppercase text-on-surface-variant hidden md:block">
              {t("sortedByPoints")}
            </div>
          </div>

          {predictions.status === "offline" ? (
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-xl text-center">
              <p className="text-body-lg text-on-surface mb-sm">
                {t("predictionsOffline")}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {t("predictionsOfflineHint")}
              </p>
            </div>
          ) : (
            <PredictionsTable
              rows={predictions.rows}
              currentUserId={userId}
              emptyMessage={
                isScheduled
                  ? t("noPredictionsYet")
                  : t("noPredictionsSubmitted")
              }
            />
          )}
        </section>
      </main>
      <BottomNav active="dashboard" />
    </>
  );
}
