import { describe, expect, it } from "vitest";
import {
  arrayBufferToBase64,
  urlBase64ToUint8Array,
} from "@/lib/push-client";

describe("push-client base64 helpers", () => {
  it("round-trips bytes through base64", () => {
    const bytes = new Uint8Array([0, 1, 2, 64, 127, 128, 250, 255]);
    const b64 = arrayBufferToBase64(bytes.buffer);
    const back = urlBase64ToUint8Array(b64);
    expect(Array.from(back)).toEqual(Array.from(bytes));
  });

  it("decodes URL-safe base64 (- and _) like its standard form", () => {
    const standard = urlBase64ToUint8Array("++//");
    const urlSafe = urlBase64ToUint8Array("--__");
    expect(Array.from(urlSafe)).toEqual(Array.from(standard));
  });

  it("tolerates missing padding", () => {
    // "AAA" (3 chars) needs one "=" of padding to decode to 2 bytes.
    expect(urlBase64ToUint8Array("AAA")).toHaveLength(2);
  });

  it("returns an empty string for a null buffer", () => {
    expect(arrayBufferToBase64(null)).toBe("");
  });
});
