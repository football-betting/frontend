import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordResetToken } from "@/db/schema";

export type PasswordResetTokenRow = typeof passwordResetToken.$inferSelect;

export async function createPasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, userId));
  await db.insert(passwordResetToken).values({ userId, tokenHash, expiresAt });
}

export async function findPasswordResetTokenByHash(
  tokenHash: string,
): Promise<PasswordResetTokenRow | undefined> {
  return db.query.passwordResetToken.findFirst({
    where: eq(passwordResetToken.tokenHash, tokenHash),
  });
}

export async function deletePasswordResetTokensForUser(
  userId: number,
): Promise<void> {
  await db
    .delete(passwordResetToken)
    .where(eq(passwordResetToken.userId, userId));
}
