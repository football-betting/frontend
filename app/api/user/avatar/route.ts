import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getCurrentSession } from "@/lib/session";
import { updateUserAvatar } from "@/lib/user";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  AVATAR_SIZE,
  MAX_AVATAR_BYTES,
  validateAvatarUpload,
} from "@/lib/avatar";

const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const OUTPUT_EXT = "webp";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) {
    return jsonError("notLoggedIn", 401);
  }

  const userId = Number(sessionUser.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return jsonError("notLoggedIn", 401);
  }

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "avatar");
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

  let file: File | null = null;
  try {
    const formData = await request.formData();
    const value = formData.get("avatar");
    if (value instanceof File) {
      file = value;
    }
  } catch {
    return jsonError("invalidRequestBody", 400);
  }

  if (!file) {
    return jsonError("noFileProvided", 400);
  }

  const validation = validateAvatarUpload({
    type: file.type,
    size: file.size,
  });
  if (!validation.ok) {
    if (validation.reason === "size") {
      return jsonError("imageTooLarge", 413);
    }
    return jsonError("unsupportedImageType", 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_AVATAR_BYTES) {
    return jsonError("invalidImage", 400);
  }

  let output: Buffer;
  try {
    output = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return jsonError("invalidImage", 400);
  }

  const fileName = `${userId}.${OUTPUT_EXT}`;
  const publicPath = `/uploads/avatars/${fileName}`;

  try {
    await mkdir(AVATAR_DIR, { recursive: true });
    await writeFile(path.join(AVATAR_DIR, fileName), output);
    await updateUserAvatar(userId, publicPath);
  } catch (error) {
    console.error("[avatar] save failed", error);
    return jsonError("failedToSaveAvatar", 500);
  }

  return new Response(JSON.stringify({ success: true, avatar: publicPath }), {
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
