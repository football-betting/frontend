import { z } from "zod";

export const MATCH_STATUSES = [
  "SCHEDULED",
  "IN_PLAY",
  "PAUSED",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
  "SUSPENDED",
] as const;

const teamSchema = z.object({
  name: z.string().min(1),
  tla: z.string().min(2).max(5),
  crest: z.string().optional(),
});

export const matchImportSchema = z.object({
  id: z.number().int().positive(),
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  status: z.enum(MATCH_STATUSES),
  utcDate: z.number().int(),
  score: z.unknown().optional(),
  homeScore: z.number().int().nullable().optional(),
  awayScore: z.number().int().nullable().optional(),
});

export type MatchImportInput = z.infer<typeof matchImportSchema>;
