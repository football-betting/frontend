import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "@/lib/validation/password";

describe("changePasswordSchema", () => {
  it("accepts a valid payload where new equals confirm", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when new password is shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("newPassword"),
      );
      expect(issue?.message).toBe("newPasswordTooShort");
    }
  });

  it("rejects when confirm does not equal new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "newpass123",
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("confirmPassword"),
      );
      expect(issue?.message).toBe("passwordsDoNotMatch");
    }
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when current password is missing", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when a field is not a string", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: 12345678,
      confirmPassword: 12345678,
    });
    expect(result.success).toBe(false);
  });
});
