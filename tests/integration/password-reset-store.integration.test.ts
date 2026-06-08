import { describe, expect, it } from "vitest";
import { getUserByEmail } from "@/lib/user";
import {
  createPasswordResetToken,
  deletePasswordResetTokensForUser,
  findPasswordResetTokenByHash,
} from "@/lib/password-reset-store";
import { SEED_EMAIL } from "./helpers";

describe("password-reset store (round-trip on seeded DB)", () => {
  it("creates, finds and deletes a reset token", async () => {
    const u = await getUserByEmail(SEED_EMAIL.testUser);
    const expiresAt = new Date(Date.now() + 3_600_000);

    await createPasswordResetToken(u!.id, "hash-abc", expiresAt);
    const found = await findPasswordResetTokenByHash("hash-abc");
    expect(found?.userId).toBe(u!.id);

    await deletePasswordResetTokensForUser(u!.id);
    expect(await findPasswordResetTokenByHash("hash-abc")).toBeUndefined();
  });

  it("keeps only the latest token per user (create replaces older ones)", async () => {
    const u = await getUserByEmail(SEED_EMAIL.ada);
    const soon = new Date(Date.now() + 60_000);

    await createPasswordResetToken(u!.id, "hash-old", soon);
    await createPasswordResetToken(u!.id, "hash-new", soon);

    expect(await findPasswordResetTokenByHash("hash-old")).toBeUndefined();
    expect((await findPasswordResetTokenByHash("hash-new"))?.userId).toBe(u!.id);
  });

  it("returns undefined for an unknown token hash", async () => {
    expect(await findPasswordResetTokenByHash("does-not-exist")).toBeUndefined();
  });
});
