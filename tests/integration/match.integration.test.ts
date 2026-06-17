import { describe, expect, it } from "vitest";
import {
  getLiveMatches,
  getLiveState,
  getMatchById,
  getUpcomingMatches,
} from "@/lib/match";
import { isUpcomingStatus } from "@/lib/reminders";
import { db } from "@/lib/db";
import { match } from "@/db/schema";
import { first } from "./helpers";

const TEAM = { name: "Test FC", tla: "TST" };

async function insertMatch(id: number, status: string, utcDate: Date) {
  await db
    .insert(match)
    .values({
      id,
      homeTeam: TEAM,
      awayTeam: { name: "Other FC", tla: "OTH" },
      status,
      utcDate,
      score: null,
      homeScore: null,
      awayScore: null,
    })
    .onConflictDoUpdate({ target: match.id, set: { status } });
}

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

  it("includes IN_PLAY and PAUSED (halftime) matches in the live block", async () => {
    const inPlayId = -9001;
    const pausedId = -9002;
    await insertMatch(inPlayId, "IN_PLAY", new Date("2026-06-01T18:00:00Z"));
    await insertMatch(pausedId, "PAUSED", new Date("2026-06-01T20:00:00Z"));

    const liveIds = (await getLiveMatches()).map((m) => m.id);
    expect(liveIds).toContain(inPlayId);
    expect(liveIds).toContain(pausedId);

    const upcomingIds = (await getUpcomingMatches()).map((m) => m.id);
    expect(upcomingIds).not.toContain(pausedId);
  });
});
