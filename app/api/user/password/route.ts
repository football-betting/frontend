import { Argon2id } from "oslo/password";
import { getCurrentSession } from "@/lib/session";
import { getUserById, updateUserPassword } from "@/lib/user";
import { changePasswordSchema } from "@/lib/validation/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const argon2id = new Argon2id({
  memorySize: 19456,
  iterations: 2,
  tagLength: 32,
  parallelism: 1,
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readBody(request: Request): Promise<{
  currentPassword: unknown;
  newPassword: unknown;
  confirmPassword: unknown;
} | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      };
    }
    const formData = await request.formData();
    return {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };
  } catch {
    return null;
  }
}

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
  const limit = checkRateLimit(ip, "password");
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ error: "tooManyRequests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...(limit.retryAfter
            ? { "Retry-After": String(limit.retryAfter) }
            : {}),
        },
      },
    );
  }

  const raw = await readBody(request);
  if (!raw) {
    return jsonError("invalidRequestBody", 400);
  }

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "invalidInput";
    return jsonError(message, 400);
  }

  const { currentPassword, newPassword } = parsed.data;

  const existing = await getUserById(userId);
  if (!existing) {
    return jsonError("notLoggedIn", 401);
  }

  const valid = await argon2id.verify(existing.password, currentPassword);
  if (!valid) {
    return jsonError("currentPasswordIncorrect", 400);
  }

  try {
    const hash = await argon2id.hash(newPassword);
    await updateUserPassword(userId, hash);
  } catch (error) {
    console.error("[password] update failed", error);
    return jsonError("failedToUpdatePassword", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function GET(): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
