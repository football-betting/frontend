import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { fetchApi } from "@/lib/api";
import { RatingResponseSchema, type RatingResponse } from "@/lib/rating";
import { DEPARTMENTS, displayDepartment } from "@/lib/data/departments";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { RankingTable } from "@/components/ranking/RankingTable";
import { ScoringInfobox } from "@/components/ranking/ScoringInfobox";
import { RankingTabs, type RankingTab } from "@/components/ranking/RankingTabs";

interface RankingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TAB_BY_PARAM: Record<string, string> = {
  global: "global",
  langenfeld: "Langenfeld",
  mannheim: "Mannheim",
  mainz: "Mainz",
};

async function loadRating(): Promise<RatingResponse | null> {
  try {
    return await fetchApi("rating", {
      wrappedByKey: "table",
      schema: RatingResponseSchema,
    });
  } catch (error) {
    console.error("[ranking] rating API offline:", error);
    return null;
  }
}

function resolveInitialTab(raw: string | string[] | undefined): string {
  if (typeof raw !== "string") {
    return "global";
  }
  return TAB_BY_PARAM[raw.toLowerCase()] ?? "global";
}

export default async function RankingPage({
  searchParams,
}: RankingPageProps): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  const userId = Number(user.id);

  const params = await searchParams;
  const initialActive = resolveInitialTab(params.tab);

  const rating = await loadRating();
  const t = await getTranslations("Ranking");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <TopAppBar active="ranking" />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <div className="mb-lg">
          <h1 className="text-headline-lg-mobile md:text-headline-lg uppercase tracking-tight">
            {t("leaderboard")}
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        {rating ? (
          <>
            <RankingTabs
              tabs={buildTabs(tCommon("global"))}
              initialActive={initialActive}
              panels={buildPanels(rating, userId, t("noRankingData"))}
            />
            <div className="mt-xl grid grid-cols-1 md:grid-cols-3 gap-lg">
              <ScoringInfobox />
            </div>
          </>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-xl text-center">
            <p className="text-body-lg text-on-surface mb-sm">{t("offline")}</p>
            <p className="text-body-sm text-on-surface-variant">
              {t("offlineHint")}
            </p>
          </div>
        )}
      </main>
      <BottomNav active="ranking" />
    </>
  );
}

function buildTabs(globalLabel: string): RankingTab[] {
  return [
    { id: "global", label: globalLabel },
    ...DEPARTMENTS.map((d) => ({ id: d, label: displayDepartment(d) })),
  ];
}

function buildPanels(
  rating: RatingResponse,
  currentUserId: number,
  noDataMessage: string,
): Record<string, React.ReactNode> {
  const panels: Record<string, React.ReactNode> = {
    global: (
      <RankingTable
        users={rating.global}
        currentUserId={currentUserId}
        emptyMessage={noDataMessage}
      />
    ),
  };
  for (const dept of DEPARTMENTS) {
    panels[dept] = (
      <RankingTable
        users={rating.departments[dept] ?? []}
        currentUserId={currentUserId}
      />
    );
  }
  return panels;
}
