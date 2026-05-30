import { describe, expect, it } from "vitest";
import {
  decideAvatarMode,
  initialsFromName,
  validateAvatarUpload,
  MAX_AVATAR_BYTES,
} from "@/lib/avatar";

describe("validateAvatarUpload", () => {
  it("accepts png/jpeg/webp under the size limit", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateAvatarUpload({ type, size: 1024 })).toEqual({
        ok: true,
        type,
      });
    }
  });

  it("normalizes content-type with charset/casing", () => {
    expect(validateAvatarUpload({ type: "IMAGE/PNG; charset=binary", size: 10 })).toEqual({
      ok: true,
      type: "image/png",
    });
  });

  it("rejects SVG (XSS risk)", () => {
    expect(validateAvatarUpload({ type: "image/svg+xml", size: 100 })).toEqual({
      ok: false,
      reason: "type",
    });
  });

  it("rejects non-image types", () => {
    expect(
      validateAvatarUpload({ type: "application/pdf", size: 100 }),
    ).toEqual({ ok: false, reason: "type" });
    expect(validateAvatarUpload({ type: "text/html", size: 100 })).toEqual({
      ok: false,
      reason: "type",
    });
    expect(validateAvatarUpload({ type: "", size: 100 })).toEqual({
      ok: false,
      reason: "type",
    });
  });

  it("rejects files over the size limit before processing", () => {
    expect(
      validateAvatarUpload({ type: "image/png", size: MAX_AVATAR_BYTES + 1 }),
    ).toEqual({ ok: false, reason: "size" });
  });

  it("rejects empty files", () => {
    expect(validateAvatarUpload({ type: "image/png", size: 0 })).toEqual({
      ok: false,
      reason: "empty",
    });
  });
});

describe("decideAvatarMode", () => {
  it("prefers an uploaded photo when a path is present", () => {
    expect(
      decideAvatarMode({ avatarPath: "/uploads/avatars/1.webp", initials: "RP" }),
    ).toBe("photo");
  });

  it("falls back to initials when there is no photo but a name", () => {
    expect(decideAvatarMode({ avatarPath: null, initials: "RP" })).toBe(
      "initials",
    );
    expect(decideAvatarMode({ avatarPath: "", initials: "RP" })).toBe(
      "initials",
    );
    expect(decideAvatarMode({ avatarPath: "   ", initials: "RP" })).toBe(
      "initials",
    );
  });

  it("falls back to the person icon when neither photo nor initials exist", () => {
    expect(decideAvatarMode({ avatarPath: null, initials: "" })).toBe("icon");
    expect(decideAvatarMode({ avatarPath: undefined, initials: "  " })).toBe(
      "icon",
    );
  });
});

describe("initialsFromName", () => {
  it("takes first and last initials from a two-part name", () => {
    expect(initialsFromName("Rosa Parks")).toBe("RP");
  });

  it("uses first and last for multi-part names", () => {
    expect(initialsFromName("Jean Luc Picard")).toBe("JP");
  });

  it("uses a single initial for a one-word name", () => {
    expect(initialsFromName("Ada")).toBe("A");
  });

  it("returns empty string for empty/whitespace input", () => {
    expect(initialsFromName("")).toBe("");
    expect(initialsFromName("   ")).toBe("");
  });
});
