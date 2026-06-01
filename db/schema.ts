import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const match = sqliteTable("match", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: false }),
  homeTeam: text("homeTeam", { mode: "json" }).notNull(),
  awayTeam: text("awayTeam", { mode: "json" }).notNull(),
  status: text("status").notNull(),
  utcDate: integer("utcDate", { mode: "timestamp" }).notNull(),
  score: text("score", { mode: "json" }),
  homeScore: integer("homeScore"),
  awayScore: integer("awayScore"),
});

export const user = sqliteTable("user", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  username: text("username").notNull().unique(),
  department: text("department").notNull(),
  winner: text("winner").notNull(),
  secretWinner: text("secretWinner").notNull(),
  avatar: text("avatar"),
});

export const session = sqliteTable("session", {
  id: text("id").notNull().primaryKey(),
  userId: integer("user_id").references(() => user.id),
  expiresAt: integer("expires_at").notNull(),
});

export const passwordResetToken = sqliteTable("password_reset_token", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const tip = sqliteTable(
  "tip",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => user.id),
    matchId: integer("match_id").references(() => match.id),
    date: integer("date", { mode: "timestamp" }).notNull(),
    scoreHome: integer("score_home", { mode: "number" }).notNull(),
    scoreAway: integer("score_away", { mode: "number" }).notNull(),
  },
  (table) => ({
    tipUserMatchUnique: uniqueIndex("tip_user_match_unique").on(
      table.userId,
      table.matchId,
    ),
  }),
);
