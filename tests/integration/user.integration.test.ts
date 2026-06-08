import { describe, expect, it } from "vitest";
import { getUserByEmail, getUserById, getUserEmailsByIds } from "@/lib/user";
import { SEED_EMAIL } from "./helpers";

describe("user store (seeded demo data)", () => {
  it("reads a seeded user by email", async () => {
    const u = await getUserByEmail(SEED_EMAIL.ada);
    expect(u).toBeDefined();
    expect(u?.username).toBe("AdaLovelace");
    expect(u?.department).toBe("Mainz");
  });

  it("reads the same user back by id", async () => {
    const byEmail = await getUserByEmail(SEED_EMAIL.ada);
    expect(byEmail).toBeDefined();
    const byId = await getUserById(byEmail!.id);
    expect(byId?.email).toBe(SEED_EMAIL.ada);
  });

  it("maps ids to emails", async () => {
    const u = await getUserByEmail(SEED_EMAIL.testUser);
    const map = await getUserEmailsByIds([u!.id]);
    expect(map.get(u!.id)).toBe(SEED_EMAIL.testUser);
  });

  it("returns undefined for an unknown email", async () => {
    expect(await getUserByEmail("nobody@local.dev")).toBeUndefined();
  });
});
