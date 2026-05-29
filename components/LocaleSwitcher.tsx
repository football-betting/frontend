"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/locale-action";
import { locales, type Locale } from "@/i18n/config";

export function LocaleSwitcher(): React.ReactElement {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(locale: Locale): void {
    if (locale === active) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
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
          className={`text-label-caps uppercase px-xs transition-colors ${
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
