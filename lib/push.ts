import "server-only";
import webpush from "web-push";
import type { PushSubscriptionRecord } from "@/lib/push-store";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

// Pure payload builder — unit-testable without VAPID config or a network. The
// service worker parses exactly this shape (see app/sw.ts).
export function buildPushPayload(payload: PushPayload): string {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
  });
}

interface VapidConfig {
  subject: string;
  publicKey: string;
  privateKey: string;
}

function readVapidConfig(): VapidConfig {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  const missing: string[] = [];
  if (!subject) missing.push("VAPID_SUBJECT");
  if (!publicKey) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (missing.length > 0) {
    throw new Error(`Web push is not configured: missing ${missing.join(", ")}`);
  }

  return {
    subject: subject as string,
    publicKey: publicKey as string,
    privateKey: privateKey as string,
  };
}

let vapidConfigured = false;

function ensureVapidConfigured(): void {
  if (vapidConfigured) return;
  const { subject, publicKey, privateKey } = readVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

// A push service responds 404/410 when a subscription is permanently gone, so
// the caller should prune that endpoint from the store.
export function isGoneStatus(status: number): boolean {
  return status === 404 || status === 410;
}

function extractStatusCode(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
}

export type SendPushResult =
  | { ok: true }
  | { ok: false; gone: boolean; statusCode: number | null };

// Sends a single push. Never throws: failures are returned so the cron can keep
// going through the rest of the batch and prune dead endpoints.
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: string,
): Promise<SendPushResult> {
  try {
    ensureVapidConfigured();
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );
    return { ok: true };
  } catch (error) {
    const statusCode = extractStatusCode(error);
    return {
      ok: false,
      gone: statusCode !== null && isGoneStatus(statusCode),
      statusCode,
    };
  }
}

export const _internal = {
  readVapidConfig,
  resetVapidConfigured(): void {
    vapidConfigured = false;
  },
};
