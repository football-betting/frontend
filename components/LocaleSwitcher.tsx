"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { setLocale } from "@/i18n/locale-action";
import { locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher(): React.ReactElement {
  const active = useLocale();
  const [pending, startTransition] = useTransition();

  function change(locale: Locale): void {
    if (locale === active) return;
    startTransition(async () => {
      await setLocale(locale);
      // Full reload so the new language applies even when the service worker
      // serves a cached RSC payload (a soft router.refresh() showed stale text
      // in the installed PWA / on mobile).
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-xs" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          disabled={pending}
          aria-pressed={l === active}
          className={`text-label-caps uppercase px-xs transition-colors disabled:opacity-60 ${
            l === active
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
