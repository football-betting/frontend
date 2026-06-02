import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";

const FEATURE_KEYS = [
  "liveScoring",
  "predicting",
  "rankings",
  "history",
  "reminders",
  "pwaOffline",
  "passwordReset",
  "avatars",
  "languages",
] as const;

export default async function FeaturesPage(): Promise<React.ReactElement> {
  const t = await getTranslations("Features");

  return (
    <>
      <TopAppBar active="dashboard" />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-bold mb-xs">{t("title")}</h1>
          <p className="text-body-sm text-on-surface-variant">{t("intro")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {FEATURE_KEYS.map((key) => (
            <section
              key={key}
              className="bg-surface-container rounded-lg p-lg border border-outline-variant"
            >
              <h2 className="text-body-lg font-bold text-on-background mb-xs">
                {t(`items.${key}.title`)}
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                {t(`items.${key}.desc`)}
              </p>
            </section>
          ))}
        </div>
      </main>
      <BottomNav active="dashboard" />
    </>
  );
}
