import { describe, expect, it } from "vitest";
import {
  REMINDER_CHANNELS,
  activeChannels,
  isValidChannel,
  remindersActive,
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

describe("activeChannels (FE-073 independent channels)", () => {
  it("returns no channels when both are off (zero channels allowed)", () => {
    expect(activeChannels({ email: false, push: false })).toEqual([]);
  });

  it("returns email only when email is on and push is off", () => {
    expect(activeChannels({ email: true, push: false })).toEqual(["email"]);
  });

  it("returns push only when email is off (email is turn-off-able)", () => {
    expect(activeChannels({ email: false, push: true })).toEqual(["push"]);
  });

  it("returns both email-first when both are active", () => {
    expect(activeChannels({ email: true, push: true })).toEqual([
      "email",
      "push",
    ]);
  });
});

describe("remindersActive", () => {
  it("is false when no channel is active", () => {
    expect(remindersActive([])).toBe(false);
    expect(remindersActive(activeChannels({ email: false, push: false }))).toBe(
      false,
    );
  });

  it("is true when at least one channel is active", () => {
    expect(remindersActive(["email"])).toBe(true);
    expect(remindersActive(["push"])).toBe(true);
    expect(remindersActive(activeChannels({ email: true, push: true }))).toBe(
      true,
    );
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
