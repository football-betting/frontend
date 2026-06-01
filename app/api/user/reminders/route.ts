import { getCurrentSession } from "@/lib/session";
import { replaceLeadMinutes } from "@/lib/reminder-store";
import { remindersSchema } from "@/lib/validation/reminders";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readBody(
  request: Request,
): Promise<{ leadMinutes: unknown } | null> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return { leadMinutes: body.leadMinutes };
  } catch {
    return null;
  }
}

export async function PUT(request: Request): Promise<Response> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) {
    return jsonError("notLoggedIn", 401);
  }

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

  const raw = await readBody(request);
  if (!raw) {
    return jsonError("invalidRequestBody", 400);
  }

  const parsed = remindersSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "invalidInput";
    return jsonError(message, 400);
  }

  try {
    await replaceLeadMinutes(userId, parsed.data.leadMinutes);
  } catch (error) {
    console.error("[reminders] update failed", error);
    return jsonError("failedToUpdateReminders", 500);
  }

  return new Response(
    JSON.stringify({ success: true, leadMinutes: parsed.data.leadMinutes }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "PUT" } });
}
