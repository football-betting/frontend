import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "currentPasswordRequired" }),
    newPassword: z.string().min(8, { message: "newPasswordTooShort" }),
    confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "invalidResetToken" }),
    newPassword: z.string().min(8, { message: "newPasswordTooShort" }),
    confirmPassword: z.string().min(1, { message: "confirmPasswordRequired" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
