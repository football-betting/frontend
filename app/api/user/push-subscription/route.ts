import { getCurrentSession } from "@/lib/session";
import {
  deletePushSubscriptionForUser,
  savePushSubscription,
} from "@/lib/push-store";
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from "@/lib/validation/push-subscription";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function rateLimited(retryAfter?: number): Response {
  return new Response(JSON.stringify({ error: "tooManyRequests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function requireUserId(): Promise<number | null> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) return null;
  const userId = Number(sessionUser.id);
  if (!Number.isFinite(userId) || userId <= 0) return null;
  return userId;
}

export async function POST(request: Request): Promise<Response> {
  const userId = await requireUserId();
  if (userId === null) return jsonError("notLoggedIn", 401);

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "push-subscription");
  if (!limit.ok) return rateLimited(limit.retryAfter);

  const body = await readJson(request);
  if (body === null) return jsonError("invalidRequestBody", 400);

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "invalidInput", 400);
  }

  try {
    await savePushSubscription(
      userId,
      {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
      },
      new Date(),
    );
  } catch (error) {
    console.error("[push-subscription] save failed", error);
    return jsonError("failedToUpdateReminders", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(request: Request): Promise<Response> {
  const userId = await requireUserId();
  if (userId === null) return jsonError("notLoggedIn", 401);

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "push-subscription");
  if (!limit.ok) return rateLimited(limit.retryAfter);

  const body = await readJson(request);
  if (body === null) return jsonError("invalidRequestBody", 400);

  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "invalidInput", 400);
  }

  try {
    await deletePushSubscriptionForUser(userId, parsed.data.endpoint);
  } catch (error) {
    console.error("[push-subscription] delete failed", error);
    return jsonError("failedToUpdateReminders", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
