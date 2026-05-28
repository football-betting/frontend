import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validation/auth";

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

