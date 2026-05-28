"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

interface TipFormProps {
  matchId: number;
  initialTip?: { scoreHome: number; scoreAway: number } | null;
  disabled?: boolean;
}

export function TipForm({
  matchId,
  initialTip = null,
  disabled = false,
}: TipFormProps): React.ReactElement {
  const router = useRouter();
  const [tipHome, setTipHome] = useState<string>(
    initialTip ? String(initialTip.scoreHome) : "",
  );
  const [tipAway, setTipAway] = useState<string>(
    initialTip ? String(initialTip.scoreAway) : "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (disabled) return;
    setError(null);
    setSaved(false);
    setPending(true);

    const form = new FormData();
    form.set("tip1", tipHome);
    form.set("tip2", tipAway);

    try {
      const res = await fetch(`/api/tip/${matchId}`, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        return;
      }

      let message = "Failed to save tip.";
      try {
        const body: unknown = await res.json();
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
        ) {
          message = (body as { error: string }).error;
        }
      } catch {
        // ignore
      }
      setError(message);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  const buttonLabel = saved
    ? "SAVED"
    : pending
      ? "..."
      : initialTip
        ? "EDIT"
        : "SAVE";

  return (
    <div className="flex flex-col gap-xs">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-md justify-end"
      >
        <div className="flex gap-xs items-center">
          <input
            type="number"
            min={0}
            max={20}
            required
            value={tipHome}
            onChange={(e) => setTipHome(e.target.value)}
            disabled={disabled || pending}
            placeholder="-"
            aria-label="Home score tip"
            className="w-12 min-h-12 bg-surface-container-low border border-outline-variant rounded text-center text-headline-md font-mono focus:border-primary focus:ring-0 transition-colors disabled:opacity-60"
          />
          <span className="text-outline-variant">:</span>
          <input
            type="number"
            min={0}
            max={20}
            required
            value={tipAway}
            onChange={(e) => setTipAway(e.target.value)}
            disabled={disabled || pending}
            placeholder="-"
            aria-label="Away score tip"
            className="w-12 min-h-12 bg-surface-container-low border border-outline-variant rounded text-center text-headline-md font-mono focus:border-primary focus:ring-0 transition-colors disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || pending}
          className={`px-lg py-2 min-h-12 rounded-lg text-label-caps uppercase font-bold transition-all active:scale-95 disabled:opacity-60 ${
            saved
              ? "bg-tertiary text-on-tertiary"
              : "bg-primary text-on-primary hover:opacity-90"
          }`}
        >
          {buttonLabel}
        </button>
      </form>
      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-danger text-right px-xs"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
