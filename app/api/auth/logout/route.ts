import { cookies } from "next/headers";
import { lucia } from "@/lib/auth";
import { getCurrentSession } from "@/lib/session";

export async function POST(): Promise<Response> {
  const { session } = await getCurrentSession();
  if (session) {
    await lucia.invalidateSession(session.id);
  }

  const blank = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(blank.name, blank.value, blank.attributes);

  return new Response(null, { status: 302, headers: { Location: "/login" } });
}

export function GET(): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
