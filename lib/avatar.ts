export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 256;

export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];

export type AvatarValidation =
  | { ok: true; type: AllowedAvatarType }
  | { ok: false; reason: "type" | "size" | "empty" };

export function validateAvatarUpload(input: {
  type: string;
  size: number;
}): AvatarValidation {
  if (input.size <= 0) {
    return { ok: false, reason: "empty" };
  }
  if (input.size > MAX_AVATAR_BYTES) {
    return { ok: false, reason: "size" };
  }
  const normalized = input.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(normalized)) {
    return { ok: false, reason: "type" };
  }
  return { ok: true, type: normalized as AllowedAvatarType };
}

export type AvatarMode = "photo" | "initials" | "icon";

export interface AvatarDecisionInput {
  avatarPath: string | null | undefined;
  initials: string;
}

export function decideAvatarMode(input: AvatarDecisionInput): AvatarMode {
  if (input.avatarPath && input.avatarPath.trim().length > 0) {
    return "photo";
  }
  if (input.initials.trim().length > 0) {
    return "initials";
  }
  return "icon";
}

export function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return (parts[0] ?? "").charAt(0).toUpperCase();
  }
  const first = parts[0] ?? "";
  const last = parts[parts.length - 1] ?? "";
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
