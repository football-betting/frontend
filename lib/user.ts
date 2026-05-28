import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/db/schema";

export type DatabaseUser = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export async function getUserByEmail(
  email: string,
): Promise<DatabaseUser | undefined> {
  return db.query.user.findFirst({ where: eq(user.email, email) });
}

export async function getUserById(
  id: number,
): Promise<DatabaseUser | undefined> {
  return db.query.user.findFirst({ where: eq(user.id, id) });
}

export async function createUser(newUser: NewUser): Promise<number> {
  const inserted = await db
    .insert(user)
    .values(newUser)
    .returning({ id: user.id });
  const created = inserted[0];
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created.id;
}
