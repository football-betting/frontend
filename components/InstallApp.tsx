"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "loading" | "hidden" | "android" | "ios";

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIos(): boolean {
  const nav = window.navigator;
  const iOSDevice = /iphone|ipad|ipod/i.test(nav.userAgent);
  // iPadOS reports a desktop UA but has touch points.
  const iPadOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/**
 * "Install the app" card. Self-hides unless the app is genuinely installable:
 * - Android/Chrome: shows a button that triggers the native install dialog
 *   (captured from `beforeinstallprompt`).
 * - iOS/Safari: shows the manual "Share → Add to Home Screen" instruction.
 * - Desktop, or already installed (standalone): renders nothing.
 * It lives in the account/settings area, so it only appears after login.
 */
export function InstallApp(): React.ReactElement | null {
  const t = useTranslations("Install");
  const [mode, setMode] = useState<Mode>("loading");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone()) {
      setMode("hidden");
      return;
    }
    if (isIos()) {
      setMode("ios");
      return;
    }
    // Android / Chromium: wait for the installability signal. Desktop stays
    // hidden because we only set "android" once this fires on a mobile-eligible
    // context and we never surface it elsewhere.
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = (): void => setMode("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "loading" || mode === "hidden") return null;

  async function install(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode("hidden");
  }

  return (
    <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
      <h2 className="text-label-caps uppercase tracking-widest text-primary mb-md">
        {t("title")}
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-lg">
        {t("description")}
      </p>
      {mode === "android" ? (
        <button
          type="button"
          onClick={install}
          className="w-full bg-primary text-on-primary font-bold uppercase tracking-tight py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {t("installButton")}
        </button>
      ) : (
        <div className="flex items-start gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-primary"
          >
            ios_share
          </span>
          <p className="text-body-sm text-on-surface">{t("iosHint")}</p>
        </div>
      )}
    </section>
  );
}
