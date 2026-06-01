"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { arrayBufferToBase64, urlBase64ToUint8Array } from "@/lib/push-client";
import { extractErrorKey } from "@/lib/error-message";

interface PushToggleProps {
  initialEnabled: boolean;
}

type PushState = "idle" | "working" | "enabled" | "disabled";

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
  const [state, setState] = useState<PushState>(
    initialEnabled ? "enabled" : "disabled",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  function showError(messageOrKey: string): void {
    const message = tErrors.has(messageOrKey)
      ? tErrors(messageOrKey)
      : messageOrKey;
    setError(message);
  }

  async function setChannel(enabledValue: boolean): Promise<boolean> {
    const res = await fetch("/api/user/reminder-channels", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ channel: "push", enabled: enabledValue }),
    });
    if (res.ok) return true;
    try {
      const key = extractErrorKey(await res.json());
      if (key !== null && tErrors.has(key)) {
        setError(tErrors(key));
        return false;
      }
    } catch {
      // fall through
    }
    setError(t("pushError"));
    return false;
  }

  async function enable(): Promise<void> {
    setError(null);
    if (!pushSupported()) {
      showError(t("pushUnsupported"));
      return;
    }
    if (!vapidKey) {
      showError(t("pushUnsupported"));
      return;
    }
    setPending(true);
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("disabled");
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
            p256dh: json.keys?.p256dh ?? arrayBufferToBase64(
              subscription.getKey("p256dh"),
            ),
            auth: json.keys?.auth ?? arrayBufferToBase64(
              subscription.getKey("auth"),
            ),
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
        setState("disabled");
        return;
      }

      const channelOk = await setChannel(true);
      if (!channelOk) {
        setState("disabled");
        return;
      }
      setEnabled(true);
      setState("enabled");
    } catch {
      setState("disabled");
      showError(t("pushError"));
    } finally {
      setPending(false);
    }
  }

  async function disable(): Promise<void> {
    setError(null);
    setPending(true);
    setState("working");
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
      setState("disabled");
    } catch {
      showError(t("pushError"));
    } finally {
      setPending(false);
    }
  }

  function onToggle(): void {
    if (pending) return;
    if (enabled) {
      void disable();
    } else {
      void enable();
    }
  }

  return (
    <div className="space-y-sm">
      <label className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg cursor-pointer">
        <span className="text-body-lg text-on-surface">
          {t("pushChannel")}
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={enabled}
          onChange={onToggle}
          disabled={pending}
        />
      </label>
      <p className="text-[11px] text-on-surface-variant">{t("pushHint")}</p>
      {state === "working" ? (
        <p aria-live="polite" className="text-body-sm text-on-surface-variant">
          {t("pushWorking")}
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
