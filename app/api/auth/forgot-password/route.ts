import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail } from "@/lib/user";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
} from "@/lib/password-reset";
import { createPasswordResetToken } from "@/lib/password-reset-store";
import { sendPasswordResetEmail } from "@/lib/mail";
import { resolveAppOrigin } from "@/lib/app-origin";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

function genericResponse(): Response {
  return NextResponse.json({ ok: true }, { status: 200 });
}

async function readEmail(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return body.email;
  }
  const formData = await request.formData();
  return formData.get("email");
}

export async function POST(request: NextRequest): Promise<Response> {
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "forgot-password");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "tooManyRequests" },
      {
        status: 429,
        headers: limit.retryAfter
          ? { "Retry-After": String(limit.retryAfter) }
          : undefined,
      },
    );
  }

  let email: unknown;
  try {
    email = await readEmail(request);
  } catch {
    return genericResponse();
  }

  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) {
    return genericResponse();
  }

  const user = await getUserByEmail(parsed.data.email);

  if (user) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = resetTokenExpiry();
    const origin = resolveAppOrigin(request);

    // Decouple the reset issuance from the response: do NOT await it. The
    // response time is then constant whether or not the user exists, closing
    // the timing-enumeration side channel. issueReset wraps its whole body in a
    // try/catch, so the fire-and-forget promise never rejects (no unhandled
    // rejection).
    void issueReset(user.id, user.email, token, tokenHash, expiresAt, origin);
  }

  return genericResponse();
}

async function issueReset(
  userId: number,
  email: string,
  token: string,
  tokenHash: string,
  expiresAt: Date,
  origin: string | null,
): Promise<void> {
  try {
    await createPasswordResetToken(userId, tokenHash, expiresAt);

    if (origin === null) {
      // Production without APP_BASE_URL: do not build a Host-derived link.
      console.error(
        "[forgot-password] APP_BASE_URL is unset in production; skipping reset email",
      );
      return;
    }
    const resetUrl = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  } catch (error) {
    console.error("[forgot-password] failed to issue reset", error);
  }
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
