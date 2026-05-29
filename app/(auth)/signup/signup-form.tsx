"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { DEPARTMENTS, displayDepartment } from "@/lib/data/departments";
import { TEAMS } from "@/lib/data/teams";

export function SignupForm(): React.ReactElement {
  const t = useTranslations("Auth");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const password = data.get("password");
    const rePassword = data.get("rePassword");
    if (
      typeof password === "string" &&
      typeof rePassword === "string" &&
      password !== rePassword
    ) {
      setError(t("passwordsDoNotMatch"));
      return;
    }
    if (typeof password === "string" && password.length < 8) {
      setError(t("invalidPassword"));
      return;
    }

    const winner = data.get("winner");
    const secretWinner = data.get("secretWinner");
    if (
      typeof winner === "string" &&
      typeof secretWinner === "string" &&
      winner === secretWinner
    ) {
      setError(t("winnersMustDiffer"));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        window.location.assign("/login?registered=true");
        return;
      }

      let message = t("couldNotCreateAccount");
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
        // ignore parse failure
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="space-y-xs">
          <label
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="firstName"
          >
            {t("firstName")}
          </label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
            id="firstName"
            name="firstName"
            placeholder="John"
            required
            type="text"
            autoComplete="given-name"
            disabled={pending}
          />
        </div>
        <div className="space-y-xs">
          <label
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="lastName"
          >
            {t("lastName")}
          </label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
            id="lastName"
            name="lastName"
            placeholder="Doe"
            required
            type="text"
            autoComplete="family-name"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant block"
          htmlFor="username"
        >
          {t("username")}
        </label>
        <div className="relative">
          <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">
            person
          </span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md pl-[44px] text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
            id="username"
            name="username"
            placeholder="striker_01"
            required
            type="text"
            autoComplete="username"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant block"
          htmlFor="email"
        >
          {t("emailAddress")}
        </label>
        <div className="relative">
          <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">
            mail
          </span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md pl-[44px] text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
            id="email"
            name="email"
            placeholder="email@organization.com"
            required
            type="email"
            autoComplete="email"
            disabled={pending}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div className="space-y-xs">
          <label
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="password"
          >
            {t("password")}
          </label>
          <div className="relative">
            <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">
              lock
            </span>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md pl-[44px] text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
              id="password"
              name="password"
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
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="rePassword"
          >
            {t("repeatPassword")}
          </label>
          <div className="relative">
            <span className="absolute left-md top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">
              lock
            </span>
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md pl-[44px] text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:opacity-30"
              id="rePassword"
              name="rePassword"
              placeholder="••••••••"
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              disabled={pending}
            />
          </div>
        </div>
      </div>

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant block"
          htmlFor="department"
        >
          {t("department")}
        </label>
        <select
          className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
          id="department"
          name="department"
          required
          defaultValue=""
          disabled={pending}
        >
          <option disabled value="">
            {t("selectLocation")}
          </option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {displayDepartment(d)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-md border-t border-outline-variant/30">
        <div className="space-y-xs">
          <label
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="winner"
          >
            {t("tournamentWinner")}
          </label>
          <select
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            id="winner"
            name="winner"
            required
            defaultValue=""
            disabled={pending}
          >
            <option disabled value="">
              {t("selectTeam")}
            </option>
            {TEAMS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-xs">
          <label
            className="text-label-caps uppercase text-on-surface-variant block"
            htmlFor="secretWinner"
          >
            {t("secretWinner")}
          </label>
          <select
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            id="secretWinner"
            name="secretWinner"
            required
            defaultValue=""
            disabled={pending}
          >
            <option disabled value="">
              {t("selectTeam")}
            </option>
            {TEAMS.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
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

      <button
        className="w-full bg-primary-container text-on-primary-container hover:bg-primary py-lg text-label-caps uppercase tracking-widest font-bold transition-all active:scale-[0.98] mt-lg disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <span className="material-symbols-outlined animate-spin text-[18px] align-middle">
            progress_activity
          </span>
        ) : (
          t("register")
        )}
      </button>
    </form>
  );
}
