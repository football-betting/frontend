import { cookies } from "next/headers";
import { cache } from "react";
import type { Session, User } from "lucia";
import { lucia } from "@/lib/auth";

// Auth guard pattern: protected routes live under `app/(app)/` and inherit the
// redirect from `app/(app)/layout.tsx`. Do not re-implement the unauthenticated
// check in individual pages — call `getCurrentSession()` directly when a page
// needs the user; it is `cache()`-wrapped, so the second call is free.
export const getCurrentSession = cache(
  async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return { user: null, session: null };
    }
    const result = await lucia.validateSession(sessionId);
    try {
      if (result.session && result.session.fresh) {
        const fresh = lucia.createSessionCookie(result.session.id);
        cookieStore.set(fresh.name, fresh.value, fresh.attributes);
      }
      if (!result.session) {
        const blank = lucia.createBlankSessionCookie();
        cookieStore.set(blank.name, blank.value, blank.attributes);
      }
    } catch {
      // cookies().set() throws inside Server Components — ignore.
    }
    return result;
  },
);
