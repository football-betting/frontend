import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";
import { lucia, REMEMBER_COOKIE, REMEMBER_MAX_AGE_SECONDS } from "@/lib/auth";
import { getUserByEmail } from "@/lib/user";
import { loginSchema } from "@/lib/validation/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const argon2id = new Argon2id({
  memorySize: 19456,
  iterations: 2,
  tagLength: 32,
  parallelism: 1,
});

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0ZHVtbXlzYWx0$" +
  "ZHVtbXloYXNoZHVtbXloYXNoZHVtbXloYXNoZHVtbXloYXNoMQ";

const GENERIC_ERROR = "Email or password incorrect.";

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

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "login");
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ error: "Too many requests, try again later." }),
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
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "Invalid input";
    return jsonError(message, 400);
  }

  const { email, password } = parsed.data;
  const existing = await getUserByEmail(email);

  if (!existing) {
    await argon2id.verify(DUMMY_HASH, password);
    return jsonError(GENERIC_ERROR, 400);
  }

  const valid = await argon2id.verify(existing.password, password);
  if (!valid) {
    return jsonError(GENERIC_ERROR, 400);
  }

  const session = await lucia.createSession(String(existing.id), {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();

  const rememberValue = formData.get("remember");
  const remember =
    rememberValue === "on" ||
    rememberValue === "true" ||
    rememberValue === "1";

  if (remember) {
    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    cookieStore.set(REMEMBER_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REMEMBER_MAX_AGE_SECONDS,
    });
  } else {
    const sessionScoped = { ...sessionCookie.attributes };
    delete sessionScoped.maxAge;
    delete sessionScoped.expires;
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionScoped);
    cookieStore.set(REMEMBER_COOKIE, "", { path: "/", maxAge: 0 });
  }

  if (wantsJson(request)) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 302, headers: { Location: "/" } });
}
