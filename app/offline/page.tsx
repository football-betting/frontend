"use client";

import { useTranslations } from "next-intl";

export default function OfflinePage(): React.ReactElement {
  const t = useTranslations("Offline");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-md px-lg text-center bg-surface text-on-surface">
      <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
        wifi_off
      </span>
      <h1 className="text-headline-md font-bold">{t("title")}</h1>
      <p className="text-body-md text-on-surface-variant max-w-sm">
        {t("description")}
      </p>
    </main>
  );
}
