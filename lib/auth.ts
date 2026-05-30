import { Lucia } from "lucia";
import {
  DrizzleSQLiteAdapter,
  type SQLiteSessionTable,
  type SQLiteUserTable,
} from "@lucia-auth/adapter-drizzle";
import { db } from "@/lib/db";
import { session, user } from "@/db/schema";

const adapter = new DrizzleSQLiteAdapter(
  db,
  session as unknown as SQLiteSessionTable,
  user as unknown as SQLiteUserTable,
);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      username: attributes.username,
      department: attributes.department,
      winner: attributes.winner,
      secretWinner: attributes.secretWinner,
    };
  },
});

export interface DatabaseUserAttributes {
  email: string;
  username: string;
  department: string;
  winner: string;
  secretWinner: string;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// Companion cookie marking a "remember me" login. Lucia's session-cookie
// expiry is global, so the login route and session refresh read this flag to
// decide whether the session cookie is persistent (30 days) or session-scoped.
export const REMEMBER_COOKIE = "auth_remember";
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
