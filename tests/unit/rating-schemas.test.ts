import { describe, expect, it } from "vitest";
import {
  RatingMatchInfoSchema,
  RatingResponseSchema,
  RatingTableSchema,
  RatingUserSchema,
} from "@/lib/rating";

function makeMatchInfo(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    match_id: "2",
    user: "ToniKroos",
    user_id: 2,
    score: 4,
    team1: { name: "Poland", tla: "POL" },
    team2: { name: "France", tla: "FRA" },
    tip_home: 1,
    tip_away: 1,
    score_home: 1,
    score_away: 1,
    date: 1718048296,
    ...overrides,
  };
}

function makeUser(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    name: "ToniKroos",
    user_id: 2,
    department: "Langenfeld",
    position: 1,
    score_sum: 21,
    sum_win_exact: 1,
    sum_score_diff: 1,
    sum_team: 0,
    extra_point: 15,
    tips: [makeMatchInfo()],
    ...overrides,
  };
}

describe("RatingMatchInfoSchema", () => {
  it("accepts a valid Rust MatchInfo payload", () => {
    expect(RatingMatchInfoSchema.safeParse(makeMatchInfo()).success).toBe(true);
  });

  it("accepts null tip_home/tip_away/score_home/score_away (Option<i32> serialises as null)", () => {
    const payload = makeMatchInfo({
      tip_home: null,
      tip_away: null,
      score_home: null,
      score_away: null,
    });
    expect(RatingMatchInfoSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects when match_id is a number (Rust serialises as String)", () => {
    expect(
      RatingMatchInfoSchema.safeParse(makeMatchInfo({ match_id: 2 })).success,
    ).toBe(false);
  });

  it("rejects when team1 is missing the tla field", () => {
    expect(
      RatingMatchInfoSchema.safeParse(
        makeMatchInfo({ team1: { name: "Poland" } }),
      ).success,
    ).toBe(false);
  });

  it("rejects when score is a string", () => {
    expect(
      RatingMatchInfoSchema.safeParse(makeMatchInfo({ score: "4" })).success,
    ).toBe(false);
  });
});

describe("RatingUserSchema", () => {
  it("accepts a valid Rust UserRating payload", () => {
    expect(RatingUserSchema.safeParse(makeUser()).success).toBe(true);
  });

  it("accepts an empty tips array (e.g. when calculate_positions clears tips)", () => {
    expect(RatingUserSchema.safeParse(makeUser({ tips: [] })).success).toBe(
      true,
    );
  });

  it("rejects when score_sum is a string", () => {
    expect(
      RatingUserSchema.safeParse(makeUser({ score_sum: "21" })).success,
    ).toBe(false);
  });

  it("rejects when name is missing", () => {
    const { name: _name, ...rest } = makeUser();
    expect(RatingUserSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects when a tip inside tips[] is malformed", () => {
    const payload = makeUser({
      tips: [makeMatchInfo({ team2: "France" })],
    });
    expect(RatingUserSchema.safeParse(payload).success).toBe(false);
  });
});

describe("RatingResponseSchema", () => {
  it("accepts a valid table payload (matches the unwrapped /rating response)", () => {
    const payload = {
      global: [makeUser()],
      departments: {
        Langenfeld: [makeUser()],
        London: [makeUser({ name: "RobbieFowler", department: "London" })],
      },
    };
    expect(RatingResponseSchema.safeParse(payload).success).toBe(true);
  });

  it("accepts an empty global list and empty departments map", () => {
    expect(
      RatingResponseSchema.safeParse({ global: [], departments: {} }).success,
    ).toBe(true);
  });

  it("rejects when the table field shape is missing 'departments'", () => {
    expect(RatingResponseSchema.safeParse({ global: [] }).success).toBe(false);
  });

  it("rejects when 'global' is an object instead of an array", () => {
    expect(
      RatingResponseSchema.safeParse({ global: {}, departments: {} }).success,
    ).toBe(false);
  });

  it("rejects when a department value is not an array", () => {
    expect(
      RatingResponseSchema.safeParse({
        global: [],
        departments: { Langenfeld: makeUser() },
      }).success,
    ).toBe(false);
  });

  it("RatingTableSchema is an alias of RatingResponseSchema", () => {
    expect(RatingTableSchema).toBe(RatingResponseSchema);
  });
});
