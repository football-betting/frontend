import { z } from "zod";
import { getBrand } from "@/lib/brand";
import { DEPARTMENTS } from "@/lib/data/departments";
import { TEAM_CODES } from "@/lib/data/teams";

export const loginSchema = z.object({
  email: z.string().email({ message: "invalidEmail" }),
  password: z.string().min(8, { message: "invalidPassword" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function isAllowedSignupEmailDomain(email: string): boolean {
  const policy = getBrand().emailPolicy;
  if (policy === "all") {
    return true;
  }
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return false;
  }
  return policy.allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export const signupSchema = z
  .object({
    username: z.string().min(1, { message: "username" }),
    email: z.string().email({ message: "invalidEmail" }),
    password: z.string().min(8, { message: "invalidPassword" }),
    rePassword: z.string().min(8, { message: "invalidPassword" }),
    department: z.enum(DEPARTMENTS as [string, ...string[]], {
      message: "department",
    }),
    winner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "winner",
    }),
    secretWinner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "secretWinner",
    }),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "passwordsDoNotMatch",
    path: ["rePassword"],
  })
  .refine((data) => data.winner !== data.secretWinner, {
    message: "winnersMustDiffer",
    path: ["secretWinner"],
  })
  .refine(
    (data) =>
      process.env.NODE_ENV !== "production" ||
      isAllowedSignupEmailDomain(data.email),
    {
      message: "valanticEmailOnly",
      path: ["email"],
    },
  );

export type SignupInput = z.infer<typeof signupSchema>;
