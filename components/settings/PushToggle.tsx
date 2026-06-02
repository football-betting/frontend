"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { arrayBufferToBase64, urlBase64ToUint8Array } from "@/lib/push-client";
import { extractErrorKey } from "@/lib/error-message";

interface PushToggleProps {
  // Whether the account already has at least one device subscription. Used to
  // seed the account-wide "push active" gate before the client refines it.
  initialAccountActive: boolean;
  // Reports whether push is active for the ACCOUNT (>= 1 subscription exists,
  // best-effort from this device's perspective) so the parent can gate the
  // lead-time toggles.
  onActiveChange: (active: boolean) => void;
}

type Support = "unknown" | "unsupported" | "default" | "granted" | "denied";

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Push can only be toggled from the INSTALLED PWA (standalone display mode), not
// a regular browser tab. iOS Safari exposes the legacy `navigator.standalone`.
function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function PushToggle({
  initialAccountActive,
  onActiveChange,
}: PushToggleProps): React.ReactElement {
  const t = useTranslations("Settings");
  const tErrors = useTranslations("Errors");
  const [enabled, setEnabled] = useState(false);
  const [support, setSupport] = useState<Support>("unknown");
  const [standalone, setStandalone] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    setStandalone(isStandalonePwa());
    if (!pushSupported()) {
      setSupport("unsupported");
      return;
    }
    setSupport(Notification.permission as Support);
    // Refine "this device subscribed" from the actual service worker state.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(sub !== null))
      .catch(() => undefined);
  }, []);

  function showError(messageOrKey: string): void {
    setError(tErrors.has(messageOrKey) ? tErrors(messageOrKey) : messageOrKey);
  }

  async function enable(): Promise<void> {
    setError(null);
    if (!pushSupported() || !vapidKey) {
      showError(t("pushUnsupported"));
      return;
    }
    setWorking(true);
    try {
      const permission = await Notification.requestPermission();
      setSupport(permission as Support);
      if (permission !== "granted") {
        showError(t("pushPermissionDenied"));
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/user/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh:
              json.keys?.p256dh ??
              arrayBufferToBase64(subscription.getKey("p256dh")),
            auth:
              json.keys?.auth ??
              arrayBufferToBase64(subscription.getKey("auth")),
          },
        }),
      });
      if (!res.ok) {
        await subscription.unsubscribe().catch(() => undefined);
        try {
          const key = extractErrorKey(await res.json());
          showError(key ?? "pushError");
        } catch {
          showError(t("pushError"));
        }
        return;
      }

      setEnabled(true);
      onActiveChange(true);
    } catch {
      showError(t("pushError"));
    } finally {
      setWorking(false);
    }
  }

  async function disable(): Promise<void> {
    setError(null);
    setWorking(true);
    try {
      if (pushSupported()) {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          await fetch("/api/user/push-subscription", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe().catch(() => undefined);
        }
      }
      setEnabled(false);
      // This device unsubscribed. Other devices may still hold a subscription,
      // but from here we can only attest to this one; treat account push as
      // inactive for the gate (the server reconciles on next load).
      onActiveChange(false);
    } catch {
      showError(t("pushError"));
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-md">
      <p className="text-body-sm text-on-surface-variant">{t("pushHint")}</p>

      {support === "unsupported" ? (
        <p className="text-body-sm text-on-surface-variant">
          {t("pushUnsupported")}
        </p>
      ) : !standalone ? (
        <p className="text-body-sm text-on-surface-variant border border-outline-variant bg-surface-container-highest px-md py-sm rounded-lg">
          {t("pushInstallRequired")}
        </p>
      ) : enabled ? (
        <div className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg">
          <span className="text-body-sm text-on-surface inline-flex items-center gap-xs">
            <span
              aria-hidden
              className="material-symbols-outlined text-[18px] text-primary"
            >
              notifications_active
            </span>
            {t("pushEnabledStatus")}
          </span>
          <button
            type="button"
            onClick={() => void disable()}
            disabled={working}
            className="text-label-caps uppercase text-on-surface-variant hover:text-on-surface px-3 py-2 rounded-lg border border-outline-variant transition-colors disabled:opacity-60"
          >
            {working ? t("pushWorking") : t("pushDisableButton")}
          </button>
        </div>
      ) : support === "denied" ? (
        <p className="text-body-sm text-on-surface-variant border border-outline-variant bg-surface-container-highest px-md py-sm rounded-lg">
          {t("pushPermissionDenied")}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={working}
          className="bg-primary text-on-primary font-bold uppercase tracking-tight px-5 py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {working ? t("pushWorking") : t("pushEnableButton")}
        </button>
      )}

      {!standalone && initialAccountActive ? (
        <p className="text-body-sm text-on-surface-variant">
          {t("pushOtherDeviceActive")}
        </p>
      ) : null}

      {error ? (
        <p
          aria-live="polite"
          className="text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm rounded-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
