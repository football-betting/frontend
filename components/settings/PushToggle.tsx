"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { arrayBufferToBase64, urlBase64ToUint8Array } from "@/lib/push-client";
import { extractErrorKey } from "@/lib/error-message";

interface PushToggleProps {
  initialEnabled: boolean;
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

export function PushToggle({
  initialEnabled,
}: PushToggleProps): React.ReactElement {
  const t = useTranslations("Settings");
  const tErrors = useTranslations("Errors");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [support, setSupport] = useState<Support>("unknown");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!pushSupported()) {
      setSupport("unsupported");
      return;
    }
    setSupport(Notification.permission as Support);
  }, []);

  function showError(messageOrKey: string): void {
    setError(tErrors.has(messageOrKey) ? tErrors(messageOrKey) : messageOrKey);
  }

  async function setChannel(value: boolean): Promise<boolean> {
    const res = await fetch("/api/user/reminder-channels", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ channel: "push", enabled: value }),
    });
    if (res.ok) return true;
    try {
      const key = extractErrorKey(await res.json());
      if (key !== null && tErrors.has(key)) {
        setError(tErrors(key));
        return false;
      }
    } catch {
      // fall through to generic error
    }
    setError(t("pushError"));
    return false;
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

      if (!(await setChannel(true))) return;
      setEnabled(true);
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
      await setChannel(false);
      setEnabled(false);
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
