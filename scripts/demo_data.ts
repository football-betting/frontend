import Database from "better-sqlite3";
import { Argon2id } from "oslo/password";
import path from "node:path";

type TeamRef = { name: string; tla: string };

type SeedUser = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  department: string;
  winner: string;
  secretWinner: string;
};

type SeedMatch = {
  id: number;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  status: "FINISHED" | "IN_PLAY" | "SCHEDULED";
  utcDate: number;
  homeScore: number | null;
  awayScore: number | null;
};

type SeedTip = {
  userEmail: string;
  matchId: number;
  scoreHome: number;
  scoreAway: number;
};

const TEAM = {
  GER: { name: "Germany", tla: "GER" },
  ESP: { name: "Spain", tla: "ESP" },
  FRA: { name: "France", tla: "FRA" },
  ITA: { name: "Italy", tla: "ITA" },
  POR: { name: "Portugal", tla: "POR" },
  ENG: { name: "England", tla: "ENG" },
  NED: { name: "Netherlands", tla: "NED" },
  POL: { name: "Poland", tla: "POL" },
  CRO: { name: "Croatia", tla: "CRO" },
} as const;

const USERS: SeedUser[] = [
  {
    email: "ada@dev.local",
    username: "AdaLovelace",
    firstName: "Ada",
    lastName: "Lovelace",
    department: "Maintz",
    winner: "DEU",
    secretWinner: "ESP",
  },
  {
    email: "alan@dev.local",
    username: "AlanTuring",
    firstName: "Alan",
    lastName: "Turing",
    department: "Maintz",
    winner: "ENG",
    secretWinner: "FRA",
  },
  {
    email: "marie@dev.local",
    username: "MarieCurie",
    firstName: "Marie",
    lastName: "Curie",
    department: "Mannheim",
    winner: "FRA",
    secretWinner: "DEU",
  },
  {
    email: "nikola@dev.local",
    username: "NikolaTesla",
    firstName: "Nikola",
    lastName: "Tesla",
    department: "Mannheim",
    winner: "HRV",
    secretWinner: "ITA",
  },
  {
    email: "rosa@dev.local",
    username: "RosaParks",
    firstName: "Rosa",
    lastName: "Parks",
    department: "Mannheim",
    winner: "ESP",
    secretWinner: "POR",
  },
  {
    email: "me@dev.local",
    username: "TestUser",
    firstName: "Test",
    lastName: "User",
    department: "Langenfeld",
    winner: "DEU",
    secretWinner: "NLD",
  },
  {
    email: "albert@dev.local",
    username: "AlbertEinstein",
    firstName: "Albert",
    lastName: "Einstein",
    department: "Langenfeld",
    winner: "DEU",
    secretWinner: "ITA",
  },
  {
    email: "isaac@dev.local",
    username: "IsaacNewton",
    firstName: "Isaac",
    lastName: "Newton",
    department: "Langenfeld",
    winner: "POR",
    secretWinner: "ENG",
  },
];

function buildMatches(now: number): SeedMatch[] {
  const HOUR = 3_600_000;
  const DAY = 86_400_000;
  return [
    {
      id: 1,
      homeTeam: TEAM.GER,
      awayTeam: TEAM.ESP,
      status: "FINISHED",
      utcDate: now - 7 * DAY,
      homeScore: 2,
      awayScore: 0,
    },
    {
      id: 2,
      homeTeam: TEAM.POL,
      awayTeam: TEAM.FRA,
      status: "FINISHED",
      utcDate: now - 5 * DAY,
      homeScore: 1,
      awayScore: 1,
    },
    {
      id: 3,
      homeTeam: TEAM.ENG,
      awayTeam: TEAM.NED,
      status: "FINISHED",
      utcDate: now - 3 * DAY,
      homeScore: 0,
      awayScore: 2,
    },
    {
      id: 4,
      homeTeam: TEAM.ITA,
      awayTeam: TEAM.CRO,
      status: "FINISHED",
      utcDate: now - 1 * DAY,
      homeScore: 3,
      awayScore: 2,
    },
    {
      id: 5,
      homeTeam: TEAM.FRA,
      awayTeam: TEAM.GER,
      status: "IN_PLAY",
      utcDate: now - 45 * 60_000,
      homeScore: 1,
      awayScore: 1,
    },
    {
      id: 6,
      homeTeam: TEAM.POR,
      awayTeam: TEAM.ENG,
      status: "IN_PLAY",
      utcDate: now - 30 * 60_000,
      homeScore: 0,
      awayScore: 0,
    },
    {
      id: 7,
      homeTeam: TEAM.ESP,
      awayTeam: TEAM.ITA,
      status: "SCHEDULED",
      utcDate: now + 1 * DAY,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 8,
      homeTeam: TEAM.NED,
      awayTeam: TEAM.CRO,
      status: "SCHEDULED",
      utcDate: now + 2 * DAY,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 9,
      homeTeam: TEAM.GER,
      awayTeam: TEAM.POR,
      status: "SCHEDULED",
      utcDate: now + 3 * DAY,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 10,
      homeTeam: TEAM.FRA,
      awayTeam: TEAM.POL,
      status: "SCHEDULED",
      utcDate: now + 5 * DAY,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 11,
      homeTeam: TEAM.ENG,
      awayTeam: TEAM.ESP,
      status: "SCHEDULED",
      utcDate: now + 7 * DAY,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 12,
      homeTeam: TEAM.ITA,
      awayTeam: TEAM.GER,
      status: "SCHEDULED",
      utcDate: now + 14 * DAY,
      homeScore: null,
      awayScore: null,
    },
  ];
}

const TIPS: SeedTip[] = [
  { userEmail: "ada@dev.local", matchId: 1, scoreHome: 2, scoreAway: 0 },
  { userEmail: "ada@dev.local", matchId: 2, scoreHome: 1, scoreAway: 1 },
  { userEmail: "ada@dev.local", matchId: 3, scoreHome: 0, scoreAway: 2 },
  { userEmail: "ada@dev.local", matchId: 4, scoreHome: 3, scoreAway: 2 },
  { userEmail: "ada@dev.local", matchId: 5, scoreHome: 1, scoreAway: 1 },
  { userEmail: "ada@dev.local", matchId: 6, scoreHome: 0, scoreAway: 0 },
  { userEmail: "ada@dev.local", matchId: 7, scoreHome: 2, scoreAway: 1 },

  { userEmail: "alan@dev.local", matchId: 1, scoreHome: 3, scoreAway: 1 },
  { userEmail: "alan@dev.local", matchId: 2, scoreHome: 0, scoreAway: 0 },
  { userEmail: "alan@dev.local", matchId: 3, scoreHome: 1, scoreAway: 3 },
  { userEmail: "alan@dev.local", matchId: 4, scoreHome: 2, scoreAway: 1 },
  { userEmail: "alan@dev.local", matchId: 5, scoreHome: 2, scoreAway: 2 },
  { userEmail: "alan@dev.local", matchId: 6, scoreHome: 1, scoreAway: 1 },

  { userEmail: "marie@dev.local", matchId: 1, scoreHome: 1, scoreAway: 0 },
  { userEmail: "marie@dev.local", matchId: 2, scoreHome: 2, scoreAway: 2 },
  { userEmail: "marie@dev.local", matchId: 3, scoreHome: 1, scoreAway: 3 },
  { userEmail: "marie@dev.local", matchId: 4, scoreHome: 1, scoreAway: 0 },
  { userEmail: "marie@dev.local", matchId: 7, scoreHome: 0, scoreAway: 1 },

  { userEmail: "nikola@dev.local", matchId: 1, scoreHome: 0, scoreAway: 2 },
  { userEmail: "nikola@dev.local", matchId: 3, scoreHome: 2, scoreAway: 0 },
  { userEmail: "nikola@dev.local", matchId: 4, scoreHome: 0, scoreAway: 3 },
  { userEmail: "nikola@dev.local", matchId: 5, scoreHome: 0, scoreAway: 2 },
  { userEmail: "nikola@dev.local", matchId: 6, scoreHome: 3, scoreAway: 0 },
  { userEmail: "nikola@dev.local", matchId: 7, scoreHome: 1, scoreAway: 2 },

  { userEmail: "rosa@dev.local", matchId: 1, scoreHome: 2, scoreAway: 0 },
  { userEmail: "rosa@dev.local", matchId: 2, scoreHome: 0, scoreAway: 1 },
  { userEmail: "rosa@dev.local", matchId: 3, scoreHome: 1, scoreAway: 2 },
  { userEmail: "rosa@dev.local", matchId: 4, scoreHome: 2, scoreAway: 2 },
  { userEmail: "rosa@dev.local", matchId: 5, scoreHome: 1, scoreAway: 0 },
  { userEmail: "rosa@dev.local", matchId: 7, scoreHome: 0, scoreAway: 0 },

  { userEmail: "me@dev.local", matchId: 1, scoreHome: 1, scoreAway: 0 },
  { userEmail: "me@dev.local", matchId: 2, scoreHome: 2, scoreAway: 2 },
  { userEmail: "me@dev.local", matchId: 3, scoreHome: 0, scoreAway: 2 },
  { userEmail: "me@dev.local", matchId: 4, scoreHome: 3, scoreAway: 3 },
  { userEmail: "me@dev.local", matchId: 5, scoreHome: 0, scoreAway: 0 },
  { userEmail: "me@dev.local", matchId: 6, scoreHome: 1, scoreAway: 0 },
  { userEmail: "me@dev.local", matchId: 7, scoreHome: 2, scoreAway: 0 },

  { userEmail: "albert@dev.local", matchId: 1, scoreHome: 3, scoreAway: 0 },
  { userEmail: "albert@dev.local", matchId: 2, scoreHome: 1, scoreAway: 1 },
  { userEmail: "albert@dev.local", matchId: 3, scoreHome: 1, scoreAway: 1 },
  { userEmail: "albert@dev.local", matchId: 5, scoreHome: 1, scoreAway: 1 },
  { userEmail: "albert@dev.local", matchId: 6, scoreHome: 0, scoreAway: 0 },

  { userEmail: "isaac@dev.local", matchId: 2, scoreHome: 1, scoreAway: 0 },
  { userEmail: "isaac@dev.local", matchId: 3, scoreHome: 2, scoreAway: 1 },
  { userEmail: "isaac@dev.local", matchId: 4, scoreHome: 4, scoreAway: 3 },
  { userEmail: "isaac@dev.local", matchId: 5, scoreHome: 2, scoreAway: 1 },
  { userEmail: "isaac@dev.local", matchId: 6, scoreHome: 2, scoreAway: 2 },
  { userEmail: "isaac@dev.local", matchId: 7, scoreHome: 1, scoreAway: 1 },
];

function isTruthyFlag(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

async function main(): Promise<void> {
  const dbPath = process.env.DATABASE_URL ?? "../shared/db/database.db";
  const resolved = path.resolve(dbPath);
  const matchTableFrozen = isTruthyFlag(process.env.MATCH_TABLE_FROZEN);

  console.log(`Seeding ${resolved}`);
  if (matchTableFrozen) {
    console.log("MATCH_TABLE_FROZEN set — skipping match table writes");
  }

  console.log(`Hashing ${USERS.length} passwords with Argon2id…`);
  const argon2id = new Argon2id({
    memorySize: 19456,
    iterations: 2,
    tagLength: 32,
    parallelism: 1,
  });
  const passwordHashes = new Map<string, string>();
  for (const u of USERS) {
    const hash = await argon2id.hash("test123");
    passwordHashes.set(u.email, hash);
    console.log(`  hashed ${u.email}`);
  }

  const sqlite = new Database(resolved);
  try {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const now = Date.now();
    const matches = buildMatches(now);

    const insertUser = sqlite.prepare(
      `INSERT INTO user (email, password, firstName, lastName, username, department, winner, secretWinner)
       VALUES (@email, @password, @firstName, @lastName, @username, @department, @winner, @secretWinner)`,
    );
    const insertMatch = sqlite.prepare(
      `INSERT INTO match (id, homeTeam, awayTeam, status, utcDate, score, homeScore, awayScore)
       VALUES (@id, @homeTeam, @awayTeam, @status, @utcDate, @score, @homeScore, @awayScore)`,
    );
    const insertTip = sqlite.prepare(
      `INSERT INTO tip (user_id, match_id, date, score_home, score_away)
       VALUES (@userId, @matchId, @date, @scoreHome, @scoreAway)`,
    );

    const seed = sqlite.transaction(() => {
      sqlite.exec("DELETE FROM session");
      sqlite.exec("DELETE FROM tip");
      sqlite.exec("DELETE FROM user");
      if (!matchTableFrozen) {
        sqlite.exec("DELETE FROM match");
      }

      sqlite.exec("DELETE FROM sqlite_sequence WHERE name IN ('user','tip')");

      const userIdByEmail = new Map<string, number>();
      for (const u of USERS) {
        const password = passwordHashes.get(u.email);
        if (!password) throw new Error(`Missing hash for ${u.email}`);
        const result = insertUser.run({
          email: u.email,
          password,
          firstName: u.firstName,
          lastName: u.lastName,
          username: u.username,
          department: u.department,
          winner: u.winner,
          secretWinner: u.secretWinner,
        });
        userIdByEmail.set(u.email, Number(result.lastInsertRowid));
      }

      if (!matchTableFrozen) {
        for (const m of matches) {
          insertMatch.run({
            id: m.id,
            homeTeam: JSON.stringify(m.homeTeam),
            awayTeam: JSON.stringify(m.awayTeam),
            status: m.status,
            utcDate: Math.floor(m.utcDate / 1000),
            score: null,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
          });
        }
      }

      const knownMatchIds = new Set<number>(
        sqlite
          .prepare("SELECT id FROM match")
          .all()
          .map((row) => (row as { id: number }).id),
      );

      const tipDate = Math.floor(now / 1000);
      let tipsInserted = 0;
      for (const t of TIPS) {
        const userId = userIdByEmail.get(t.userEmail);
        if (userId === undefined) {
          throw new Error(`Tip references unknown user ${t.userEmail}`);
        }
        if (!knownMatchIds.has(t.matchId)) {
          continue;
        }
        insertTip.run({
          userId,
          matchId: t.matchId,
          date: tipDate,
          scoreHome: t.scoreHome,
          scoreAway: t.scoreAway,
        });
        tipsInserted++;
      }
      return { tipsInserted };
    });

    const { tipsInserted } = seed();

    const userCount = (
      sqlite.prepare("SELECT count(*) as c FROM user").get() as { c: number }
    ).c;
    const matchCount = (
      sqlite.prepare("SELECT count(*) as c FROM match").get() as { c: number }
    ).c;
    const tipCount = (
      sqlite.prepare("SELECT count(*) as c FROM tip").get() as { c: number }
    ).c;

    console.log(
      `Seeded: ${userCount} users, ${matchCount} matches, ${tipsInserted} tips inserted (${tipCount} total in DB)`,
    );
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
