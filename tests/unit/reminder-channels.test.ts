import { describe, expect, it } from "vitest";
import {
  REMINDER_CHANNELS,
  channelsForUser,
  isValidChannel,
} from "@/lib/reminders";

describe("isValidChannel", () => {
  it("accepts only known channels", () => {
    for (const c of REMINDER_CHANNELS) {
      expect(isValidChannel(c)).toBe(true);
    }
    expect(isValidChannel("sms")).toBe(false);
    expect(isValidChannel("")).toBe(false);
  });
});

describe("channelsForUser", () => {
  it("defaults to email when no channels are stored (FE-059 behavior)", () => {
    expect(channelsForUser([])).toEqual(["email"]);
  });

  it("returns exactly the explicitly enabled channels", () => {
    expect(channelsForUser(["push"]).sort()).toEqual(["push"]);
    expect(channelsForUser(["email", "push"]).sort()).toEqual([
      "email",
      "push",
    ]);
  });

  it("ignores unknown channels and dedups", () => {
    expect(channelsForUser(["push", "sms", "push"])).toEqual(["push"]);
  });

  it("falls back to email if only invalid channels are stored", () => {
    expect(channelsForUser(["sms"])).toEqual(["email"]);
  });
});
