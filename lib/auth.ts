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
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      username: attributes.username,
      department: attributes.department,
      winner: attributes.winner,
      secretWinner: attributes.secretWinner,
    };
  },
});

export interface DatabaseUserAttributes {
  email: string;
  firstName: string;
  lastName: string;
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
