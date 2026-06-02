import { describe, expect, it } from "vitest";
import {
  REMINDER_CHANNELS,
  channelsForUser,
  isValidChannel,
  shouldMarkDelivery,
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

  it("keeps email as the baseline and adds push when opted in (FE-066)", () => {
    expect(channelsForUser(["push"])).toEqual(["email", "push"]);
  });

  it("keeps a single email entry when push is not opted in", () => {
    expect(channelsForUser(["email"])).toEqual(["email"]);
  });

  it("is email-first and deduped when both are stored", () => {
    expect(channelsForUser(["email", "push"])).toEqual(["email", "push"]);
    expect(channelsForUser(["push", "push"])).toEqual(["email", "push"]);
  });

  it("ignores unknown channels but always keeps email", () => {
    expect(channelsForUser(["sms"])).toEqual(["email"]);
    expect(channelsForUser(["push", "sms"])).toEqual(["email", "push"]);
  });
});

describe("shouldMarkDelivery (FE-066 mark-on-success)", () => {
  it("marks a slot only when the channel was actually delivered", () => {
    expect(shouldMarkDelivery({ channel: "email", delivered: true })).toBe(true);
    expect(shouldMarkDelivery({ channel: "push", delivered: true })).toBe(true);
  });

  it("does NOT mark a failed or targetless delivery (retried next run)", () => {
    expect(shouldMarkDelivery({ channel: "email", delivered: false })).toBe(
      false,
    );
    expect(shouldMarkDelivery({ channel: "push", delivered: false })).toBe(
      false,
    );
  });
});
