import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscription } from "@/db/schema";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Upsert by endpoint. The endpoint is globally unique. A device re-subscribing
// under the SAME user (e.g. after key rotation) updates its keys in place. If a
// DIFFERENT user presents an endpoint already owned by someone else, we must
// NOT silently re-tie it to the caller — that would let an attacker hijack
// another user's subscription. For the rare genuine device hand-off we drop the
// old row and insert a fresh one owned by the authenticated caller, so the
// endpoint is always tied to exactly one (verified) owner.
export async function savePushSubscription(
  userId: number,
  sub: PushSubscriptionRecord,
  createdAt: Date,
): Promise<void> {
  const existing = await db
    .select({ userId: pushSubscription.userId })
    .from(pushSubscription)
    .where(eq(pushSubscription.endpoint, sub.endpoint))
    .limit(1);

  const owner = existing[0]?.userId;
  if (owner !== undefined && owner !== userId) {
    await db
      .delete(pushSubscription)
      .where(eq(pushSubscription.endpoint, sub.endpoint))
      .run();
  }

  await db
    .insert(pushSubscription)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      createdAt,
    })
    // Scope the conflict update to the caller's own row: an endpoint owned by a
    // different user was already removed above, so this only ever refreshes the
    // caller's keys — it never moves ownership.
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { p256dh: sub.p256dh, auth: sub.auth },
      setWhere: eq(pushSubscription.userId, userId),
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
