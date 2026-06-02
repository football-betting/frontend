"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { REMINDER_LEAD_MINUTES } from "@/lib/reminders";
import { extractErrorKey } from "@/lib/error-message";

interface ReminderSettingsProps {
  initialLeadMinutes: number[];
  // Lead times only fire when at least one channel (email or push) is active
  // (FE-073). When no channel is active the toggles are disabled with a hint.
  channelActive: boolean;
}

export function ReminderSettings({
  initialLeadMinutes,
  channelActive,
}: ReminderSettingsProps): React.ReactElement {
  const t = useTranslations("Settings");
  const tErrors = useTranslations("Errors");
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialLeadMinutes),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  function toggle(lead: number): void {
    setSuccess(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lead)) {
        next.delete(lead);
      } else {
        next.add(lead);
      }
      return next;
    });
  }

  async function onSave(): Promise<void> {
    setError(null);
    setSuccess(false);
    setPending(true);
    const leadMinutes = REMINDER_LEAD_MINUTES.filter((l) => selected.has(l));
    try {
      const res = await fetch("/api/user/reminders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ leadMinutes }),
      });
      if (res.ok) {
        setSuccess(true);
        return;
      }
      let message = t("updateFailed");
      try {
        const key = extractErrorKey(await res.json());
        if (key !== null && tErrors.has(key)) {
          message = tErrors(key);
        }
      } catch {
        // ignore JSON parse error, fall back to default
      }
      setError(message);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-lg">
      <p className="text-body-sm text-on-surface-variant">
        {t("reminderHint")}
      </p>

      {!channelActive ? (
        <p className="text-body-sm text-on-surface-variant border border-outline-variant bg-surface-container-highest px-md py-sm rounded-lg">
          {t("reminderNoChannel")}
        </p>
      ) : null}

      <ul
        className={`space-y-sm ${channelActive ? "" : "opacity-60 pointer-events-none"}`}
      >
        {REMINDER_LEAD_MINUTES.map((lead) => {
          const checked = selected.has(lead);
          return (
            <li key={lead}>
              <label className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg cursor-pointer">
                <span className="text-body-lg text-on-surface">
                  {t(`reminderLead.${lead}`)}
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                  checked={checked}
                  onChange={() => toggle(lead)}
                  disabled={pending || !channelActive}
                />
              </label>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm rounded-lg"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          aria-live="polite"
          className="text-body-sm text-secondary border border-secondary/40 bg-secondary/10 px-md py-sm rounded-lg"
        >
          {t("reminderSaved")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={pending || !channelActive}
        className="w-full bg-primary text-on-primary font-bold uppercase tracking-tight py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {pending ? (
          <span className="material-symbols-outlined animate-spin text-[20px] align-middle">
            progress_activity
          </span>
        ) : (
          t("reminderSave")
        )}
      </button>
    </div>
  );
}
