import { getCurrentSession } from "@/lib/session";
import { updateUserDepartment } from "@/lib/user";
import { departmentSchema } from "@/lib/validation/department";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readBody(
  request: Request,
): Promise<{ department: unknown } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return { department: body.department };
    }
    const formData = await request.formData();
    return { department: formData.get("department") };
  } catch {
    return null;
  }
}

// Location is a grouping for the per-office leaderboard; it does not affect
// scoring, so it can be changed at any time (no tournament-lock gate).
export async function POST(request: Request): Promise<Response> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) {
    return jsonError("notLoggedIn", 401);
  }

  const userId = Number(sessionUser.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return jsonError("notLoggedIn", 401);
  }

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "department");
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "tooManyRequests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : {}),
      },
    });
  }

  const raw = await readBody(request);
  if (!raw) {
    return jsonError("invalidRequestBody", 400);
  }

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return jsonError(first?.message ?? "invalidInput", 400);
  }

  try {
    await updateUserDepartment(userId, parsed.data.department);
  } catch (error) {
    console.error("[department] update failed", error);
    return jsonError("failedToUpdate", 500);
  }

  return new Response(
    JSON.stringify({ success: true, department: parsed.data.department }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
