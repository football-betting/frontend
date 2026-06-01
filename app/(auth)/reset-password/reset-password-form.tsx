"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { extractErrorKey } from "@/lib/error-message";

export function ResetPasswordForm({
  token,
}: {
  token: string;
}): React.ReactElement {
  const t = useTranslations("Auth");
  const tErrors = useTranslations("Errors");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const newPassword = data.get("newPassword");
    const confirmPassword = data.get("confirmPassword");
    if (
      typeof newPassword === "string" &&
      typeof confirmPassword === "string" &&
      newPassword !== confirmPassword
    ) {
      setError(tErrors("passwordsDoNotMatch"));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setSuccess(true);
        return;
      }

      let message = t("resetPasswordFailed");
      try {
        const key = extractErrorKey(await res.json());
        if (key !== null && tErrors.has(key)) {
          message = tErrors(key);
        }
      } catch {
        // ignore parse failure
      }
      setError(message);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-lg">
        <p
          aria-live="polite"
          className="text-body-sm text-on-secondary-container bg-secondary-container px-md py-md"
        >
          {t("resetPasswordSuccess")}
        </p>
        <Link
          className="block w-full text-center bg-primary-container text-on-primary-container hover:bg-primary py-md text-headline-md font-bold uppercase tracking-tight transition-all active:scale-[0.98]"
          href="/login"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-lg" onSubmit={onSubmit} noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant"
          htmlFor="newPassword"
        >
          {t("newPassword")}
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            lock
          </span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none px-md py-md pl-[44px] text-on-surface text-body-lg transition-all placeholder:text-surface-container-highest"
            id="newPassword"
            name="newPassword"
            placeholder="••••••••"
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant"
          htmlFor="confirmPassword"
        >
          {t("confirmNewPassword")}
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            lock
          </span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none px-md py-md pl-[44px] text-on-surface text-body-lg transition-all placeholder:text-surface-container-highest"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="••••••••"
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            disabled={pending}
          />
        </div>
      </div>

      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="pt-md">
        <button
          className="w-full bg-primary-container text-on-primary-container hover:bg-primary py-md text-headline-md font-bold uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <span className="material-symbols-outlined animate-spin text-[20px] align-middle">
              progress_activity
            </span>
          ) : (
            t("setNewPassword")
          )}
        </button>
      </div>
    </form>
  );
}
