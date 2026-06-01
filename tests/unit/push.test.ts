import { describe, expect, it } from "vitest";
import { buildPushPayload, isGoneStatus } from "@/lib/push";

describe("buildPushPayload", () => {
  it("serializes exactly title, body and url for the service worker", () => {
    const json = buildPushPayload({
      title: "Tipp-Erinnerung",
      body: "Du hast dieses Spiel noch nicht getippt.",
      url: "https://example.com/match/42",
    });
    expect(JSON.parse(json)).toEqual({
      title: "Tipp-Erinnerung",
      body: "Du hast dieses Spiel noch nicht getippt.",
      url: "https://example.com/match/42",
    });
  });
});

describe("isGoneStatus", () => {
  it("treats 404 and 410 as a dead subscription", () => {
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(410)).toBe(true);
  });

  it("does not treat other statuses as gone", () => {
    expect(isGoneStatus(429)).toBe(false);
    expect(isGoneStatus(500)).toBe(false);
    expect(isGoneStatus(201)).toBe(false);
  });
});
