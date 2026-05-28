import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { match } from "@/db/schema";
import { formatDateKey } from "@/lib/format";

export interface TeamRef {
  name: string;
  tla: string;
}

export interface MatchRow {
  id: number;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  status: string;
  utcDate: Date;
  homeScore: number | null;
  awayScore: number | null;
}

function isTeamRef(value: unknown): value is TeamRef {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && typeof v.tla === "string";
}

function rowToMatch(row: typeof match.$inferSelect): MatchRow | null {
  if (!isTeamRef(row.homeTeam) || !isTeamRef(row.awayTeam)) {
    return null;
  }
  return {
    id: row.id,
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    status: row.status,
    utcDate: row.utcDate,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
  };
}

export async function getLiveMatches(): Promise<MatchRow[]> {
  const rows = await db.select().from(match).where(eq(match.status, "IN_PLAY"));
  return rows
    .map(rowToMatch)
    .filter((m): m is MatchRow => m !== null)
    .sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
}

export async function getUpcomingMatches(): Promise<MatchRow[]> {
  const now = new Date();
  const rows = await db
    .select()
    .from(match)
    .where(and(eq(match.status, "SCHEDULED"), gte(match.utcDate, now)));
  return rows
    .map(rowToMatch)
    .filter((m): m is MatchRow => m !== null)
    .sort((a, b) => a.utcDate.getTime() - b.utcDate.getTime());
}

export async function getMatchById(id: number): Promise<MatchRow | null> {
  const row = await db.query.match.findFirst({ where: eq(match.id, id) });
  if (!row) return null;
  return rowToMatch(row);
}

export function groupByDate(matches: MatchRow[]): Record<string, MatchRow[]> {
  const groups: Record<string, MatchRow[]> = {};
  for (const m of matches) {
    const key = formatDateKey(m.utcDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
}
