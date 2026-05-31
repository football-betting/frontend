import { Argon2id } from "oslo/password";
import { createUser, getUserByEmail } from "@/lib/user";
import { signupSchema } from "@/lib/validation/auth";
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

function wantsJson(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("application/json");
}

const REQUIRED_FIELDS = [
  "email",
  "password",
  "rePassword",
  "username",
  "department",
  "winner",
  "secretWinner",
] as const;

function isUniqueConstraintError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" && code.startsWith("SQLITE_CONSTRAINT");
}

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "signup");
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

  const formData = await request.formData();

  const missing: string[] = [];
  for (const field of REQUIRED_FIELDS) {
    const v = formData.get(field);
    if (typeof v !== "string" || v.length === 0) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    return jsonError("missingRequiredFields", 400);
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    rePassword: formData.get("rePassword"),
    username: formData.get("username"),
    department: formData.get("department"),
    winner: formData.get("winner"),
    secretWinner: formData.get("secretWinner"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "invalidInput";
    return jsonError(message, 400);
  }

  const data = parsed.data;

  const existing = await getUserByEmail(data.email);
  if (existing) {
    return jsonError("emailAlreadyRegistered", 400);
  }

  const passwordHash = await argon2id.hash(data.password);

  try {
    await createUser({
      email: data.email,
      password: passwordHash,
      username: data.username,
      department: data.department,
      winner: data.winner,
      secretWinner: data.secretWinner,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return jsonError("usernameTaken", 409);
    }
    throw err;
  }

  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, {
    status: 302,
    headers: { Location: "/login?registered=true" },
  });
}
