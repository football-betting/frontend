import { z } from "zod";

export const RatingTeamSchema = z.object({
  name: z.string(),
  tla: z.string(),
});

export const RatingMatchInfoSchema = z.object({
  match_id: z.string(),
  user: z.string(),
  user_id: z.number().int(),
  score: z.number().int(),
  team1: RatingTeamSchema,
  team2: RatingTeamSchema,
  tip_home: z.number().int().nullable(),
  tip_away: z.number().int().nullable(),
  score_home: z.number().int().nullable(),
  score_away: z.number().int().nullable(),
  date: z.number().int(),
});

export const RatingUserSchema = z.object({
  name: z.string(),
  user_id: z.number().int(),
  department: z.string(),
  position: z.number().int(),
  score_sum: z.number().int(),
  sum_win_exact: z.number().int(),
  sum_score_diff: z.number().int(),
  sum_team: z.number().int(),
  extra_point: z.number().int(),
  tips: z.array(RatingMatchInfoSchema),
});

export const RatingResponseSchema = z.object({
  global: z.array(RatingUserSchema),
  departments: z.record(z.string(), z.array(RatingUserSchema)),
});

export const RatingTableSchema = RatingResponseSchema;

export type RatingTeam = z.infer<typeof RatingTeamSchema>;
export type RatingMatchInfo = z.infer<typeof RatingMatchInfoSchema>;
export type RatingUser = z.infer<typeof RatingUserSchema>;
export type RatingResponse = z.infer<typeof RatingResponseSchema>;

export interface ShortTableSlice {
  topRows: RatingUser[];
  neighborRows: RatingUser[];
  hasGap: boolean;
}

export function sliceGlobalShortTable(
  global: RatingUser[],
  currentUserId: number,
): ShortTableSlice {
  if (global.length === 0) {
    return { topRows: [], neighborRows: [], hasGap: false };
  }

  const userIndexInTail = global
    .slice(3)
    .findIndex((u) => u.user_id === currentUserId);

  if (userIndexInTail > 0) {
    const start = Math.max(0, userIndexInTail - 1);
    const end = userIndexInTail + 2;
    return {
      topRows: global.slice(0, 3),
      neighborRows: global.slice(3).slice(start, end),
      hasGap: true,
    };
  }

  return {
    topRows: global.slice(0, 6),
    neighborRows: [],
    hasGap: false,
  };
}
