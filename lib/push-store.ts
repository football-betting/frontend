import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscription } from "@/db/schema";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Upsert by endpoint: a device re-subscribing (e.g. after key rotation) keeps a
// single row. The endpoint is globally unique, so we also re-tie it to the
// current session user.
export async function savePushSubscription(
  userId: number,
  sub: PushSubscriptionRecord,
  createdAt: Date,
): Promise<void> {
  await db
    .insert(pushSubscription)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      createdAt,
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId, p256dh: sub.p256dh, auth: sub.auth },
    })
    .run();
}

export async function deletePushSubscriptionForUser(
  userId: number,
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSubscription)
    .where(
      and(
        eq(pushSubscription.userId, userId),
        eq(pushSubscription.endpoint, endpoint),
      ),
    )
    .run();
}

// Cron cleanup of a dead endpoint (push service returned 404/410). Not scoped
// to a user: the endpoint is gone for whoever owned it.
export async function deletePushSubscriptionByEndpoint(
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSubscription)
    .where(eq(pushSubscription.endpoint, endpoint))
    .run();
}

export async function getPushSubscriptionsByUserIds(
  userIds: number[],
): Promise<Map<number, PushSubscriptionRecord[]>> {
  const result = new Map<number, PushSubscriptionRecord[]>();
  if (userIds.length === 0) return result;
  const wanted = new Set(userIds);
  const rows = await db
    .select({
      userId: pushSubscription.userId,
      endpoint: pushSubscription.endpoint,
      p256dh: pushSubscription.p256dh,
      auth: pushSubscription.auth,
    })
    .from(pushSubscription);
  for (const r of rows) {
    if (!wanted.has(r.userId)) continue;
    const list = result.get(r.userId) ?? [];
    list.push({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth });
    result.set(r.userId, list);
  }
  return result;
}
