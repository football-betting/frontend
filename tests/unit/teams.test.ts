import { describe, expect, it } from "vitest";
import {
  TEAMS,
  TEAM_CODES,
  isTeamCode,
  localizedTeams,
  teamName,
} from "@/lib/data/teams";

describe("teamName", () => {
  it("returns the German name for a de locale", () => {
    expect(teamName("GER", "de")).toBe("Deutschland");
    expect(teamName("BRA", "de")).toBe("Brasilien");
  });

  it("returns the English name for an en locale", () => {
    expect(teamName("GER", "en")).toBe("Germany");
    expect(teamName("BRA", "en")).toBe("Brazil");
  });

  it("treats any non-en locale as German", () => {
    expect(teamName("GER", "de-DE")).toBe("Deutschland");
    expect(teamName("GER", "fr")).toBe("Deutschland");
  });

  it("falls back to the code for an unknown team", () => {
    expect(teamName("ZZZ", "en")).toBe("ZZZ");
  });
});

describe("localizedTeams", () => {
  it("returns every team for both locales", () => {
    expect(localizedTeams("de")).toHaveLength(TEAMS.length);
    expect(localizedTeams("en")).toHaveLength(TEAMS.length);
  });

  it("localizes the names by locale", () => {
    const de = localizedTeams("de").find((t) => t.code === "GER");
    const en = localizedTeams("en").find((t) => t.code === "GER");
    expect(de?.name).toBe("Deutschland");
    expect(en?.name).toBe("Germany");
  });

  it("sorts alphabetically within the active locale", () => {
    const en = localizedTeams("en").map((t) => t.name);
    const sorted = [...en].sort((a, b) => a.localeCompare(b, "en"));
    expect(en).toEqual(sorted);
  });
});

describe("isTeamCode / TEAM_CODES", () => {
  it("accepts a known code and rejects an unknown one", () => {
    expect(isTeamCode("GER")).toBe(true);
    expect(isTeamCode("XXX")).toBe(false);
  });

  it("has exactly one unique code per team", () => {
    expect(TEAM_CODES).toHaveLength(TEAMS.length);
    expect(new Set(TEAM_CODES).size).toBe(TEAMS.length);
  });
});
