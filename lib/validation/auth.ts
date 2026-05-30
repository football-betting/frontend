import { z } from "zod";
import { DEPARTMENTS } from "@/lib/data/departments";
import { TEAM_CODES } from "@/lib/data/teams";

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "Invalid password" }),
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
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(8, { message: "Invalid password" }),
    rePassword: z.string().min(8, { message: "Invalid password" }),
    department: z.enum(DEPARTMENTS, { message: "department" }),
    winner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "winner",
    }),
    secretWinner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "secretWinner",
    }),
  })
  .refine((data) => data.password === data.rePassword, {
    message: "Passwords do not match.",
    path: ["rePassword"],
  })
  .refine((data) => data.winner !== data.secretWinner, {
    message: "Winner and secret winner must differ.",
    path: ["secretWinner"],
  })
  .refine(
    (data) =>
      process.env.NODE_ENV !== "production" ||
      isAllowedSignupEmailDomain(data.email),
    {
      message: "Only valantic.com email addresses are allowed.",
      path: ["email"],
    },
  );

export type SignupInput = z.infer<typeof signupSchema>;
