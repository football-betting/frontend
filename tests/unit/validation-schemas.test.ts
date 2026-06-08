import { describe, expect, it } from "vitest";
import {
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} from "@/lib/validation/push-subscription";
import { reminderEmailSchema } from "@/lib/validation/reminder-email";

const validSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
};

describe("pushSubscriptionSchema", () => {
  it("accepts a valid subscription", () => {
    expect(pushSubscriptionSchema.safeParse(validSub).success).toBe(true);
  });

  it("rejects a non-URL endpoint", () => {
    expect(
      pushSubscriptionSchema.safeParse({ ...validSub, endpoint: "not-a-url" })
        .success,
    ).toBe(false);
  });

  it("rejects missing or empty keys", () => {
    expect(
      pushSubscriptionSchema.safeParse({ endpoint: validSub.endpoint }).success,
    ).toBe(false);
    expect(
      pushSubscriptionSchema.safeParse({
        ...validSub,
        keys: { p256dh: "", auth: "auth-key" },
      }).success,
    ).toBe(false);
  });
});

describe("pushUnsubscribeSchema", () => {
  it("requires a URL endpoint", () => {
    expect(
      pushUnsubscribeSchema.safeParse({ endpoint: "https://x.test/e" }).success,
    ).toBe(true);
    expect(pushUnsubscribeSchema.safeParse({ endpoint: "x" }).success).toBe(
      false,
    );
  });
});

describe("reminderEmailSchema", () => {
  it("requires a boolean enabled flag", () => {
    expect(reminderEmailSchema.safeParse({ enabled: true }).success).toBe(true);
    expect(reminderEmailSchema.safeParse({ enabled: "yes" }).success).toBe(
      false,
    );
    expect(reminderEmailSchema.safeParse({}).success).toBe(false);
  });
});
