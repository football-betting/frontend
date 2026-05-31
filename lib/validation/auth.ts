import { z } from "zod";
import { DEPARTMENTS } from "@/lib/data/departments";
import { TEAM_CODES } from "@/lib/data/teams";

export const loginSchema = z.object({
  email: z.string().email({ message: "invalidEmail" }),
  password: z.string().min(8, { message: "invalidPassword" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function isAllowedSignupEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return false;
  }
  return domain === "valantic.com" || domain.endsWith(".valantic.com");
}

export const signupSchema = z
  .object({
    username: z.string().min(1, { message: "username" }),
    email: z.string().email({ message: "invalidEmail" }),
    password: z.string().min(8, { message: "invalidPassword" }),
    rePassword: z.string().min(8, { message: "invalidPassword" }),
    department: z.enum(DEPARTMENTS, { message: "department" }),
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
