import { describe, expect, it } from "vitest";
import { getLiveState, getMatchById, getUpcomingMatches } from "@/lib/match";
import { isUpcomingStatus } from "@/lib/reminders";
import { first } from "./helpers";

describe("match store (seeded demo data)", () => {
  it("returns upcoming matches: all future, SCHEDULED/TIMED, ascending", async () => {
    const matches = await getUpcomingMatches();
    expect(matches.length).toBeGreaterThan(0);

    const cutoff = Date.now() - 60_000;
    for (const m of matches) {
      expect(isUpcomingStatus(m.status)).toBe(true);
      expect(m.utcDate.getTime()).toBeGreaterThanOrEqual(cutoff);
    }

    const times = matches.map((m) => m.utcDate.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it("round-trips getMatchById for a known match", async () => {
    const target = first(
      await getUpcomingMatches(),
      "seed has no upcoming match",
    );
    const byId = await getMatchById(target.id);
    expect(byId?.id).toBe(target.id);
    expect(byId?.homeTeam.name).toBe(target.homeTeam.name);
  });

  it("reports the next kickoff via getLiveState", async () => {
    const state = await getLiveState();
    expect(state.nextKickoff).not.toBeNull();
  });
});
