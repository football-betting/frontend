import { describe, expect, it } from "vitest";
import { getUserByEmail } from "@/lib/user";
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionCountsByUserIds,
  getPushSubscriptionsByUserIds,
  savePushSubscription,
  userHasPushSubscription,
} from "@/lib/push-store";
import { SEED_EMAIL } from "./helpers";

describe("push store (round-trip on seeded DB)", () => {
  it("saves, reads and deletes a subscription", async () => {
    const u = await getUserByEmail(SEED_EMAIL.rosa);
    expect(await userHasPushSubscription(u!.id)).toBe(false);

    const sub = {
      endpoint: "https://push.example/ep-rosa",
      p256dh: "p256",
      auth: "auth",
    };
    await savePushSubscription(u!.id, sub, new Date());

    expect(await userHasPushSubscription(u!.id)).toBe(true);
    const map = await getPushSubscriptionsByUserIds([u!.id]);
    expect(map.get(u!.id)?.[0]?.endpoint).toBe(sub.endpoint);
    expect((await getPushSubscriptionCountsByUserIds([u!.id])).get(u!.id)).toBe(
      1,
    );

    await deletePushSubscriptionByEndpoint(sub.endpoint);
    expect(await userHasPushSubscription(u!.id)).toBe(false);
  });

  it("upserts the same endpoint in place (refreshes keys, no duplicate)", async () => {
    const u = await getUserByEmail(SEED_EMAIL.isaac);
    const sub = {
      endpoint: "https://push.example/ep-isaac",
      p256dh: "p1",
      auth: "a1",
    };
    await savePushSubscription(u!.id, sub, new Date());
    await savePushSubscription(
      u!.id,
      { ...sub, p256dh: "p2", auth: "a2" },
      new Date(),
    );

    const list = (await getPushSubscriptionsByUserIds([u!.id])).get(u!.id);
    expect(list).toHaveLength(1);
    expect(list?.[0]?.p256dh).toBe("p2");
  });
});
