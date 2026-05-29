"use client";

import { useState, type FormEvent } from "react";

export function LoginForm(): React.ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        window.location.assign("/");
        return;
      }

      let message = "Email or password incorrect.";
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
        // ignore JSON parse error, fall back to default
      }
      setError(message);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-lg" onSubmit={onSubmit} noValidate>
      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant"
          htmlFor="email"
        >
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            mail
          </span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none px-md py-md pl-[44px] text-on-surface text-body-lg transition-all placeholder:text-surface-container-highest"
            id="email"
            name="email"
            placeholder="name@example.com"
            required
            type="email"
            autoComplete="email"
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-xs">
        <label
          className="text-label-caps uppercase text-on-surface-variant"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            lock
          </span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none px-md py-md pl-[44px] text-on-surface text-body-lg transition-all placeholder:text-surface-container-highest"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={8}
            type="password"
            autoComplete="current-password"
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <input
          className="size-4 accent-primary"
          id="remember"
          name="remember"
          type="checkbox"
          disabled={pending}
        />
        <label
          className="text-body-sm text-on-surface-variant"
          htmlFor="remember"
        >
          Remember me
        </label>
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
            "Sign In"
          )}
        </button>
      </div>
    </form>
  );
}
