import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAllowedSignupEmailDomain,
  loginSchema,
  signupSchema,
} from "@/lib/validation/auth";

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
    const { username: _omit, ...rest } = VALID_SIGNUP;
    void _omit;
    const result = signupSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("isAllowedSignupEmailDomain", () => {
  it("accepts valantic.com and its subdomains", () => {
    expect(isAllowedSignupEmailDomain("a@valantic.com")).toBe(true);
    expect(isAllowedSignupEmailDomain("a@cec.valantic.com")).toBe(true);
    expect(isAllowedSignupEmailDomain("a@pim.valantic.com")).toBe(true);
  });

  it("accepts case-insensitively", () => {
    expect(isAllowedSignupEmailDomain("a@VALANTIC.com")).toBe(true);
    expect(isAllowedSignupEmailDomain("a@CEC.Valantic.COM")).toBe(true);
  });

  it("rejects foreign and look-alike domains", () => {
    expect(isAllowedSignupEmailDomain("a@gmail.com")).toBe(false);
    expect(isAllowedSignupEmailDomain("a@valantic.com.evil.com")).toBe(false);
    expect(isAllowedSignupEmailDomain("a@evilvalantic.com")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isAllowedSignupEmailDomain("no-at-sign")).toBe(false);
    expect(isAllowedSignupEmailDomain("")).toBe(false);
    expect(isAllowedSignupEmailDomain("a@")).toBe(false);
  });
});

describe("signupSchema email domain gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a non-valantic email in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      email: "a@gmail.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valantic subdomain email in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      email: "a@cec.valantic.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts any email outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    const result = signupSchema.safeParse({
      ...VALID_SIGNUP,
      email: "a@local.dev",
    });
    expect(result.success).toBe(true);
  });
});

