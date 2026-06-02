"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { extractErrorKey } from "@/lib/error-message";

export function PasswordChangeForm(): React.ReactElement {
  const t = useTranslations("Settings");
  const tErrors = useTranslations("Errors");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      setError(t("newPasswordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSuccess(true);
        form.reset();
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
    <form className="space-y-lg" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-md">
        <div className="space-y-sm">
          <label
            className="block text-label-caps uppercase text-on-surface-variant"
            htmlFor="currentPassword"
          >
            {t("currentPassword")}
          </label>
          <input
            className="w-full bg-surface-container-highest border border-outline-variant text-on-surface px-md py-3 rounded-lg focus:border-primary focus:outline-none transition-all"
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={pending}
          />
        </div>
        <hr className="border-outline-variant my-sm" />
        <div className="space-y-sm">
          <label
            className="block text-label-caps uppercase text-on-surface-variant"
            htmlFor="newPassword"
          >
            {t("newPassword")}
          </label>
          <input
            className="w-full bg-surface-container-highest border border-outline-variant text-on-surface px-md py-3 rounded-lg focus:border-primary focus:outline-none transition-all"
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder={t("newPasswordPlaceholder")}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={pending}
          />
        </div>
        <div className="space-y-sm">
          <label
            className="block text-label-caps uppercase text-on-surface-variant"
            htmlFor="confirmPassword"
          >
            {t("confirmPassword")}
          </label>
          <input
            className="w-full bg-surface-container-highest border border-outline-variant text-on-surface px-md py-3 rounded-lg focus:border-primary focus:outline-none transition-all"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder={t("confirmPasswordPlaceholder")}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={pending}
          />
        </div>
      </div>

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
          {t("updateSuccess")}
        </p>
      ) : null}

      <div className="pt-lg">
        <button
          className="w-full bg-primary text-on-primary font-bold uppercase tracking-tight py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <span className="material-symbols-outlined animate-spin text-[20px] align-middle">
              progress_activity
            </span>
          ) : (
            t("updatePassword")
          )}
        </button>
      </div>
    </form>
  );
}
