"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { extractErrorKey } from "@/lib/error-message";

interface EmailReminderToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function EmailReminderToggle({
  enabled,
  onChange,
}: EmailReminderToggleProps): React.ReactElement {
  const t = useTranslations("Settings");
  const tErrors = useTranslations("Errors");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setEmail(value: boolean): Promise<void> {
    setError(null);
    setWorking(true);
    try {
      const res = await fetch("/api/user/reminder-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ enabled: value }),
      });
      if (res.ok) {
        onChange(value);
        return;
      }
      let message = t("emailError");
      try {
        const key = extractErrorKey(await res.json());
        if (key !== null && tErrors.has(key)) {
          message = tErrors(key);
        }
      } catch {
        // fall back to default message
      }
      setError(message);
    } catch {
      setError(t("networkError"));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-md">
      <label className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg cursor-pointer">
        <span className="text-body-lg text-on-surface">{t("emailChannel")}</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={enabled}
          onChange={(e) => void setEmail(e.target.checked)}
          disabled={working}
        />
      </label>
      <p className="text-body-sm text-on-surface-variant">{t("emailHint")}</p>

      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm rounded-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
