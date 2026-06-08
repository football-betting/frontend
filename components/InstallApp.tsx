"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useInstall } from "@/components/InstallContext";

type Device = "loading" | "desktop" | "android" | "ios";

function detectDevice(): Device {
  const nav = window.navigator;
  const ua = nav.userAgent;
  // iPadOS reports a desktop UA but has touch points.
  const iPadOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || iPadOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * "Install the app" card, shown only on mobile (the `beforeinstallprompt`
 * signal — captured app-wide by InstallProvider — also fires on desktop Chrome,
 * so we gate on the device, not on the signal):
 * - Android: native install button when a prompt was captured, otherwise a
 *   manual "browser menu → Install app" hint.
 * - iOS/Safari: the manual "Share → Add to Home Screen" instruction.
 * - Desktop, or already installed: renders nothing.
 */
export function InstallApp(): React.ReactElement | null {
  const t = useTranslations("Install");
  const { canInstall, installed, install } = useInstall();
  const [device, setDevice] = useState<Device>("loading");

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  if (installed || device === "loading" || device === "desktop") return null;

  return (
    <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
      <h2 className="text-label-caps uppercase tracking-widest text-primary mb-md">
        {t("title")}
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-lg">
        {t("description")}
      </p>
      {device === "android" && canInstall ? (
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
            {device === "ios" ? "ios_share" : "more_vert"}
          </span>
          <p className="text-body-sm text-on-surface">
            {device === "ios" ? t("iosHint") : t("androidHint")}
          </p>
        </div>
      )}
    </section>
  );
}
