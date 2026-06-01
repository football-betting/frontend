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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

function resolveOrigin(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return request.nextUrl.origin;
}

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

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = resetTokenExpiry();

  if (!user) {
    return genericResponse();
  }

  try {
    await createPasswordResetToken(user.id, tokenHash, expiresAt);

    const origin = resolveOrigin(request);
    const resetUrl = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    console.error("[forgot-password] failed to issue reset", error);
  }

  return genericResponse();
}

export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
