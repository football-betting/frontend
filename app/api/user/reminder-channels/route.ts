import { getCurrentSession } from "@/lib/session";
import { setChannelEnabled } from "@/lib/reminder-store";
import { reminderChannelSchema } from "@/lib/validation/reminder-channels";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PUT(request: Request): Promise<Response> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) return jsonError("notLoggedIn", 401);

  const userId = Number(sessionUser.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return jsonError("notLoggedIn", 401);
  }

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "reminders");
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "tooManyRequests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(limit.retryAfter
          ? { "Retry-After": String(limit.retryAfter) }
          : {}),
      },
    });
  }

  const body = await readJson(request);
  if (body === null) return jsonError("invalidRequestBody", 400);

  const parsed = reminderChannelSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "invalidInput", 400);
  }

  try {
    await setChannelEnabled(userId, parsed.data.channel, parsed.data.enabled);
  } catch (error) {
    console.error("[reminder-channels] update failed", error);
    return jsonError("failedToUpdateReminders", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "PUT" } });
}
