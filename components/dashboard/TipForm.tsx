"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  formatTipScore,
  initialTipEditing,
  type TipScore,
} from "@/lib/tip-view";
import { extractErrorKey } from "@/lib/error-message";

interface TipFormProps {
  matchId: number;
  initialTip?: TipScore | null;
  disabled?: boolean;
}

export function TipForm({
  matchId,
  initialTip = null,
  disabled = false,
}: TipFormProps): React.ReactElement {
  const t = useTranslations("TipForm");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [tipHome, setTipHome] = useState<string>(
    initialTip ? String(initialTip.scoreHome) : "",
  );
  const [tipAway, setTipAway] = useState<string>(
    initialTip ? String(initialTip.scoreAway) : "",
  );
  const [savedTip, setSavedTip] = useState<TipScore | null>(initialTip);
  const [isEditing, setIsEditing] = useState<boolean>(
    initialTipEditing(initialTip),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const homeInputRef = useRef<HTMLInputElement>(null);
  const focusOnEdit = useRef(false);

  useEffect(() => {
    if (isEditing && focusOnEdit.current) {
      focusOnEdit.current = false;
      homeInputRef.current?.focus();
    }
  }, [isEditing]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (disabled) return;
    setError(null);

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError(t("offlineBlocked"));
      return;
    }

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
        setSavedTip({ scoreHome: Number(tipHome), scoreAway: Number(tipAway) });
        setIsEditing(false);
        router.refresh();
        return;
      }

      let message = t("failedToSave");
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

  function enterEdit(): void {
    if (disabled) return;
    setError(null);
    focusOnEdit.current = true;
    setIsEditing(true);
  }

  if (!isEditing && savedTip) {
    return (
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-md justify-end">
          <div
            onClick={disabled ? undefined : enterEdit}
            className={`text-headline-md font-mono min-h-12 flex items-center tabular-nums ${
              disabled ? "" : "cursor-pointer"
            }`}
          >
            {formatTipScore(savedTip)}
          </div>
          {disabled ? null : (
            <>
              {/* Mobile: text button (finger-friendly tap target) */}
              <button
                type="button"
                onClick={enterEdit}
                className="md:hidden px-lg py-2 min-h-12 rounded-lg text-label-caps uppercase font-bold border border-outline-variant text-on-surface-variant bg-surface-container-low hover:bg-surface-container transition-colors active:scale-95"
              >
                {t("edit")}
              </button>
              {/* Desktop: muted pencil icon */}
              <button
                type="button"
                onClick={enterEdit}
                aria-label={t("editTip")}
                className="hidden md:flex w-10 h-10 min-h-10 items-center justify-center rounded-lg text-on-surface-variant/70 hover:text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">
                  edit
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-xs"
      data-editing={savedTip ? "true" : undefined}
    >
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
            ref={homeInputRef}
            value={tipHome}
            onChange={(e) => setTipHome(e.target.value)}
            disabled={disabled || pending}
            placeholder="-"
            aria-label={t("homeScoreTip")}
            className="w-12 min-h-12 bg-surface-container-low border border-outline-variant rounded text-center text-headline-md font-mono focus:border-primary focus:outline-none focus:ring-0 hover:border-primary/50 transition-colors disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
            aria-label={t("awayScoreTip")}
            className="w-12 min-h-12 bg-surface-container-low border border-outline-variant rounded text-center text-headline-md font-mono focus:border-primary focus:outline-none focus:ring-0 hover:border-primary/50 transition-colors disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        {/* Mobile: text button (finger-friendly tap target) */}
        <button
          type="submit"
          disabled={disabled || pending}
          className="md:hidden px-lg py-2 min-h-12 rounded-lg text-label-caps uppercase font-bold bg-primary text-on-primary hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
        >
          {pending ? "..." : t("save")}
        </button>
        {/* Desktop: compact save icon */}
        <button
          type="submit"
          disabled={disabled || pending}
          aria-label={t("save")}
          className="hidden md:flex w-10 h-10 min-h-10 items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors active:scale-95 disabled:opacity-60"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              pending ? "animate-spin" : ""
            }`}
          >
            {pending ? "progress_activity" : "save"}
          </span>
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
