import { describe, expect, it } from "vitest";
import { USERS } from "@/scripts/seed-users";
import { TEAMS } from "@/lib/data/teams";

// Guards the bug XR-009 fixed: a seeded winner/secretWinner that is not a code
// the signup form offers (e.g. ISO3 "DEU" instead of the football-data TLA
// "GER", or a team not in the tournament) silently breaks the tournament-winner
// bonus, because scoring compares the stored code against TOURNAMENT_WINNER.
describe("seed team codes", () => {
  const validCodes = new Set<string>(TEAMS.map((t) => t.code));

  it("every seeded winner/secretWinner is a code the signup form offers", () => {
    for (const u of USERS) {
      expect(validCodes.has(u.winner), `${u.username} winner=${u.winner}`).toBe(
        true,
      );
      expect(
        validCodes.has(u.secretWinner),
        `${u.username} secretWinner=${u.secretWinner}`,
      ).toBe(true);
    }
  });

  it("winner and secretWinner differ for every seeded user", () => {
    for (const u of USERS) {
      expect(u.winner, u.username).not.toBe(u.secretWinner);
    }
  });
});
