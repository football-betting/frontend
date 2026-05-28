export interface RatingTeam {
  name: string;
  tla: string;
}

export interface RatingMatchInfo {
  match_id: string;
  user: string;
  user_id: number;
  score: number;
  team1: RatingTeam;
  team2: RatingTeam;
  tip_home: number | null;
  tip_away: number | null;
  score_home: number | null;
  score_away: number | null;
  date: number;
}

export interface RatingUser {
  name: string;
  user_id: number;
  department: string;
  position: number;
  score_sum: number;
  sum_win_exact: number;
  sum_score_diff: number;
  sum_team: number;
  extra_point: number;
  tips: RatingMatchInfo[];
}

export interface RatingResponse {
  global: RatingUser[];
  departments: Record<string, RatingUser[]>;
}

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

  const userIndexInTail = global.slice(3).findIndex((u) => u.user_id === currentUserId);

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
