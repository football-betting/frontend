import { describe, expect, it } from "vitest";
import { extractErrorKey } from "@/lib/error-message";

describe("extractErrorKey", () => {
  it("returns the error string from a well-formed body", () => {
    expect(extractErrorKey({ error: "tooManyRequests" })).toBe(
      "tooManyRequests",
    );
  });

  it("returns null when error is missing or not a string", () => {
    expect(extractErrorKey({})).toBeNull();
    expect(extractErrorKey({ error: 42 })).toBeNull();
    expect(extractErrorKey({ message: "boom" })).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(extractErrorKey(null)).toBeNull();
    expect(extractErrorKey(undefined)).toBeNull();
    expect(extractErrorKey("error")).toBeNull();
    expect(extractErrorKey(["error"])).toBeNull();
  });
});
