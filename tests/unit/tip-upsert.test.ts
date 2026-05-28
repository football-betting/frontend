import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tip } from "@/db/schema";

type Db = ReturnType<typeof drizzle>;

let sqlite: Database.Database;
let db: Db;

const BASELINE_SCHEMA = `
  CREATE TABLE "user" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "email" text NOT NULL,
    "password" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "username" text NOT NULL,
    "department" text NOT NULL,
    "winner" text NOT NULL,
    "secretWinner" text NOT NULL
  );
  CREATE UNIQUE INDEX "user_email_unique" ON "user" ("email");

  CREATE TABLE "match" (
    "id" integer PRIMARY KEY NOT NULL,
    "homeTeam" text NOT NULL,
    "awayTeam" text NOT NULL,
    "status" text NOT NULL,
    "utcDate" integer NOT NULL,
    "score" text,
    "homeScore" integer,
    "awayScore" integer
  );

  CREATE TABLE "tip" (
    "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    "user_id" integer REFERENCES "user"("id"),
    "match_id" integer REFERENCES "match"("id"),
    "date" integer NOT NULL,
    "score_home" integer NOT NULL,
    "score_away" integer NOT NULL
  );
  CREATE UNIQUE INDEX "tip_user_match_unique" ON "tip" ("user_id", "match_id");
`;

const TEAM_HOME = JSON.stringify({ name: "Germany", tla: "GER" });
const TEAM_AWAY = JSON.stringify({ name: "Spain", tla: "ESP" });

async function upsertTip(
  userId: number,
  matchId: number,
  scoreHome: number,
  scoreAway: number,
  date: Date,
): Promise<void> {
  await db
    .insert(tip)
    .values({ userId, matchId, date, scoreHome, scoreAway })
    .onConflictDoUpdate({
      target: [tip.userId, tip.matchId],
      set: { scoreHome, scoreAway, date },
    });
}

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(BASELINE_SCHEMA);
  db = drizzle(sqlite);

  sqlite
    .prepare(
      `INSERT INTO user (id, email, password, firstName, lastName, username, department, winner, secretWinner)
       VALUES (1, 'u@dev.local', 'x', 'U', 'Ser', 'User', 'Maintz', 'DEU', 'ESP')`,
    )
    .run();
  sqlite
    .prepare(
      `INSERT INTO match (id, homeTeam, awayTeam, status, utcDate, score, homeScore, awayScore)
       VALUES (9, ?, ?, 'SCHEDULED', 1000, NULL, NULL, NULL)`,
    )
    .run(TEAM_HOME, TEAM_AWAY);
});

afterEach(() => {
  sqlite.close();
});

describe("saveTip upsert (composite UNIQUE on user_id, match_id)", () => {
  it("inserts a new row on first call", async () => {
    await upsertTip(1, 9, 2, 1, new Date(1_700_000_000_000));
    const rows = await db
      .select()
      .from(tip)
      .where(and(eq(tip.userId, 1), eq(tip.matchId, 9)));
    expect(rows).toHaveLength(1);
    expect(rows[0].scoreHome).toBe(2);
    expect(rows[0].scoreAway).toBe(1);
  });

  it("updates the existing row on conflict, never creating a duplicate", async () => {
    await upsertTip(1, 9, 2, 1, new Date(1_700_000_000_000));
    await upsertTip(1, 9, 3, 0, new Date(1_700_000_001_000));
    const rows = await db
      .select()
      .from(tip)
      .where(and(eq(tip.userId, 1), eq(tip.matchId, 9)));
    expect(rows).toHaveLength(1);
    expect(rows[0].scoreHome).toBe(3);
    expect(rows[0].scoreAway).toBe(0);
  });

  it("five back-to-back calls for the same (user, match) collapse to one row", async () => {
    for (let i = 0; i < 5; i++) {
      await upsertTip(1, 9, i, i + 1, new Date(1_700_000_000_000 + i));
    }
    const rows = await db
      .select()
      .from(tip)
      .where(and(eq(tip.userId, 1), eq(tip.matchId, 9)));
    expect(rows).toHaveLength(1);
    expect(rows[0].scoreHome).toBe(4);
    expect(rows[0].scoreAway).toBe(5);
  });
});
