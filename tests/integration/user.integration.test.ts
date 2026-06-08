import { describe, expect, it } from "vitest";
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserEmailsByIds,
  updateUserAvatar,
  updateUserPassword,
  updateUserWinners,
} from "@/lib/user";
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

describe("user store writes (round-trip on seeded DB)", () => {
  it("creates a user and reads it back", async () => {
    const id = await createUser({
      email: "new.user@local.dev",
      password: "hash",
      username: "NewUser",
      department: "Siegen",
      winner: "GER",
      secretWinner: "BRA",
      avatar: null,
    });
    const created = await getUserById(id);
    expect(created?.email).toBe("new.user@local.dev");
    expect(created?.department).toBe("Siegen");
  });

  it("updates winners, password and avatar in place", async () => {
    const u = await getUserByEmail(SEED_EMAIL.isaac);
    await updateUserWinners(u!.id, "ESP", "POR");
    await updateUserPassword(u!.id, "new-hash");
    await updateUserAvatar(u!.id, "/avatars/x.png");

    const fresh = await getUserById(u!.id);
    expect(fresh?.winner).toBe("ESP");
    expect(fresh?.secretWinner).toBe("POR");
    expect(fresh?.password).toBe("new-hash");
    expect(fresh?.avatar).toBe("/avatars/x.png");
  });
});
