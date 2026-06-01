import { Argon2id } from "oslo/password";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { updateUserPassword } from "@/lib/user";
import { resetPasswordSchema } from "@/lib/validation/password";
import { hashResetToken, isResetTokenExpired } from "@/lib/password-reset";
import {
  deletePasswordResetTokensForUser,
  findPasswordResetTokenByHash,
} from "@/lib/password-reset-store";

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
  token: unknown;
  newPassword: unknown;
  confirmPassword: unknown;
} | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return {
        token: body.token,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      };
    }
    const formData = await request.formData();
    return {
      token: formData.get("token"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "reset-password");
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

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "invalidInput";
    return jsonError(message, 400);
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashResetToken(token);
  const record = await findPasswordResetTokenByHash(tokenHash);

  if (!record || isResetTokenExpired(record.expiresAt)) {
    return jsonError("invalidResetToken", 400);
  }

  try {
    const hash = await argon2id.hash(newPassword);
    await updateUserPassword(record.userId, hash);
    await deletePasswordResetTokensForUser(record.userId);
  } catch (error) {
    console.error("[reset-password] update failed", error);
    return jsonError("failedToUpdatePassword", 500);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
