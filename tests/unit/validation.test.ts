import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { matchImportSchema } from "@/lib/validation/match-import";

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "test1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "test1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 chars", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });
});

const VALID_SIGNUP = {
  firstName: "Test",
  lastName: "User",
  username: "testuser",
  email: "user@example.com",
  password: "test1234",
  rePassword: "test1234",
  department: "Langenfeld",
  winner: "DEU",
  secretWinner: "ESP",
};

describe("signupSchema", () => {
  it("accepts a valid payload", () => {
    const result = signupSchema.safeParse(VALID_SIGNUP);
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      rePassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when winner equals secret winner", () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      secretWinner: VALID_SIGNUP.winner,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown department", () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      department: "Berlin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown team code for winner", () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      winner: "ZZZ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      email: "no-at-sign",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { firstName: _omit, ...rest } = VALID_SIGNUP;
    void _omit;
    const result = signupSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

const VALID_MATCH_IMPORT = {
  id: 1,
  homeTeam: { name: "Germany", tla: "GER" },
  awayTeam: { name: "Spain", tla: "ESP" },
  status: "SCHEDULED",
  utcDate: 1_700_000_000,
  homeScore: null,
  awayScore: null,
};

describe("matchImportSchema", () => {
  it("accepts a valid payload", () => {
    const result = matchImportSchema.safeParse(VALID_MATCH_IMPORT);
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive id", () => {
    const result = matchImportSchema.safeParse({
      ...VALID_MATCH_IMPORT,
      id: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = matchImportSchema.safeParse({
      ...VALID_MATCH_IMPORT,
      status: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer utcDate", () => {
    const result = matchImportSchema.safeParse({
      ...VALID_MATCH_IMPORT,
      utcDate: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { homeTeam: _omit, ...rest } = VALID_MATCH_IMPORT;
    void _omit;
    const result = matchImportSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects a team with an empty name", () => {
    const result = matchImportSchema.safeParse({
      ...VALID_MATCH_IMPORT,
      homeTeam: { name: "", tla: "GER" },
    });
    expect(result.success).toBe(false);
  });
});
