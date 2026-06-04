"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/i18n/locale-action";
import { locales, type Locale } from "@/i18n/config";

const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

export function LocaleSwitcher(): React.ReactElement {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const locale = event.target.value as Locale;
    if (locale === active) return;
    startTransition(async () => {
      await setLocale(locale);
      // Full reload so the new language is applied even when the service worker
      // serves a cached RSC payload (a soft router.refresh() showed stale text
      // on mobile / the installed PWA).
      window.location.reload();
    });
  }

  return (
    <select
      aria-label="Language"
      value={active}
      onChange={onChange}
      disabled={pending}
      className="bg-surface-container-low border border-outline-variant text-on-surface text-body-sm rounded-lg px-md py-2 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
