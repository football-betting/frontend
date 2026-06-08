import { describe, expect, it } from "vitest";
import { getUserByEmail } from "@/lib/user";
import { getUpcomingMatches } from "@/lib/match";
import {
  getTipByUserAndMatch,
  getTipByUserAndMatchIds,
  saveTip,
} from "@/lib/tip";
import { first, SEED_EMAIL } from "./helpers";

describe("tip store (round-trip on seeded DB)", () => {
  it("saves, reads and upserts a tip", async () => {
    const user = await getUserByEmail(SEED_EMAIL.ada);
    const matchId = first(
      await getUpcomingMatches(),
      "seed has no upcoming match",
    ).id;

    const saved = await saveTip(user!.id, matchId, 3, 1);
    expect(saved.scoreHome).toBe(3);
    expect(saved.scoreAway).toBe(1);

    const found = await getTipByUserAndMatch(user!.id, matchId);
    expect(found?.scoreHome).toBe(3);

    const list = await getTipByUserAndMatchIds(user!.id, [matchId, -999]);
    expect(list).toHaveLength(1);

    // Saving again upserts in place — still exactly one row.
    await saveTip(user!.id, matchId, 0, 0);
    const after = await getTipByUserAndMatchIds(user!.id, [matchId]);
    expect(after).toHaveLength(1);
    expect(after[0]?.scoreHome).toBe(0);
  });

  it("returns an empty list for matches the user has not tipped", async () => {
    const user = await getUserByEmail(SEED_EMAIL.isaac);
    expect(await getTipByUserAndMatchIds(user!.id, [-1, -2])).toEqual([]);
  });
});
