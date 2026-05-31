"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { TEAMS } from "@/lib/data/teams";
import { extractErrorKey } from "@/lib/error-message";

interface WinnerEditFormProps {
  winner: string;
  secretWinner: string;
  onCancel: () => void;
  onSaved: () => void;
}

export function WinnerEditForm({
  winner: initialWinner,
  secretWinner: initialSecret,
  onCancel,
  onSaved,
}: WinnerEditFormProps): React.ReactElement {
  const t = useTranslations("Profile");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [winner, setWinner] = useState(initialWinner);
  const [secretWinner, setSecretWinner] = useState(initialSecret);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (winner === secretWinner) {
      setError(t("winnersMustDiffer"));
      return;
    }
    setPending(true);

    const form = new FormData();
    form.set("winner", winner);
    form.set("secretWinner", secretWinner);

    try {
      const res = await fetch("/api/user/winners", {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        onSaved();
        router.refresh();
        return;
      }
      let message = t("failedToUpdateWinners");
      try {
        const key = extractErrorKey(await res.json());
        if (key !== null && tErrors.has(key)) {
          message = tErrors(key);
        }
      } catch {
        // ignore
      }
      setError(message);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface-container border border-outline-variant p-lg flex flex-col gap-md"
    >
      <label className="flex flex-col gap-xs">
        <span className="text-label-caps uppercase text-on-surface-variant">
          {t("tournamentWinner")}
        </span>
        <select
          required
          value={winner}
          onChange={(e) => setWinner(e.target.value)}
          disabled={pending}
          aria-label={t("winnerSelectLabel")}
          className="min-h-12 px-md bg-surface-container-low border border-outline-variant rounded text-body-lg focus:border-primary focus:ring-0 disabled:opacity-60"
        >
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-xs">
        <span className="text-label-caps uppercase text-on-surface-variant">
          {t("secretWinner")}
        </span>
        <select
          required
          value={secretWinner}
          onChange={(e) => setSecretWinner(e.target.value)}
          disabled={pending}
          aria-label={t("secretWinnerSelectLabel")}
          className="min-h-12 px-md bg-surface-container-low border border-outline-variant rounded text-body-lg focus:border-primary focus:ring-0 disabled:opacity-60"
        >
          {TEAMS.map((t) => (
            <option key={t.code} value={t.code}>
              {t.code} — {t.name}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-danger px-xs"
        >
          {error}
        </p>
      ) : null}
      <div className="flex gap-sm justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="px-lg py-2 min-h-12 rounded-lg text-label-caps uppercase font-bold bg-surface-container-low border border-outline-variant hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-lg py-2 min-h-12 rounded-lg text-label-caps uppercase font-bold bg-primary text-on-primary hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {pending ? "..." : t("save")}
        </button>
      </div>
    </form>
  );
}
