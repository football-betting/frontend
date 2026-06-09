// Demo users for the seed. Extracted so a unit test can assert the
// winner/secretWinner codes are valid signup team codes (see
// tests/unit/seed-team-codes.test.ts) — a mismatch silently breaks the
// tournament-winner bonus, since scoring compares the stored code against
// TOURNAMENT_WINNER. Codes must be the football-data TLAs used by the signup
// form in lib/data/teams.ts (e.g. Germany is "GER", not the ISO3 "DEU").

export type SeedUser = {
  email: string;
  username: string;
  department: string;
  winner: string;
  secretWinner: string;
};

export const USERS: SeedUser[] = [
  {
    email: "ada.lovelace@local.dev",
    username: "AdaLovelace",
    department: "Mainz",
    winner: "GER",
    secretWinner: "ESP",
  },
  {
    email: "alan.turing@local.dev",
    username: "AlanTuring",
    department: "Mainz",
    winner: "ENG",
    secretWinner: "FRA",
  },
  {
    email: "marie.curie@local.dev",
    username: "MarieCurie",
    department: "Mannheim",
    winner: "FRA",
    secretWinner: "GER",
  },
  {
    email: "nikola.tesla@local.dev",
    username: "NikolaTesla",
    department: "Mannheim",
    winner: "CRO",
    secretWinner: "BRA",
  },
  {
    email: "rosa.parks@local.dev",
    username: "RosaParks",
    department: "Mannheim",
    winner: "ESP",
    secretWinner: "POR",
  },
  {
    email: "test.user@local.dev",
    username: "TestUser",
    department: "Langenfeld",
    winner: "GER",
    secretWinner: "NED",
  },
  {
    email: "albert.einstein@local.dev",
    username: "AlbertEinstein",
    department: "Langenfeld",
    winner: "GER",
    secretWinner: "BRA",
  },
  {
    email: "isaac.newton@local.dev",
    username: "IsaacNewton",
    department: "Langenfeld",
    winner: "POR",
    secretWinner: "ENG",
  },
];
