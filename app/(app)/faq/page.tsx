import { getTranslations } from "next-intl/server";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { FAQ_SECTIONS } from "@/lib/faq";
import { getBrand } from "@/lib/brand";

export default async function FaqPage(): Promise<React.ReactElement> {
  const t = await getTranslations("FAQ");
  const brand = getBrand();
  const restricted = brand.emailPolicy === "all" ? "no" : "yes";

  return (
    <>
      <TopAppBar active="dashboard" />
      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-bold mb-xs">{t("title")}</h1>
          <p className="text-body-sm text-on-surface-variant">{t("intro")}</p>
        </div>

        <div className="space-y-xl">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.key}>
              <h2 className="text-body-lg font-bold text-on-background mb-md">
                {t(`sections.${section.key}.heading`)}
              </h2>
              <div className="space-y-sm">
                {section.items.map((item) => (
                  <details
                    key={item}
                    className="group bg-surface-container rounded-lg border border-outline-variant"
                  >
                    <summary className="flex items-center justify-between gap-md cursor-pointer list-none p-lg text-body-lg font-bold text-on-background [&::-webkit-details-marker]:hidden">
                      {t(`sections.${section.key}.items.${item}.q`)}
                      <span className="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <p className="px-lg pb-lg text-body-sm text-on-surface-variant">
                      {t(`sections.${section.key}.items.${item}.a`, {
                        org: brand.org,
                        restricted,
                      })}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <BottomNav active="dashboard" />
    </>
  );
}
