import { afterEach, describe, expect, it, vi } from "vitest";

const selectRows = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => selectRows(),
    }),
  },
}));

import { isLockedFromTimestamp, isTournamentLocked } from "@/lib/tournament";

describe("isLockedFromTimestamp", () => {
  const now = 1_700_000_000_000;

  it("returns false when there are no matches (min is null)", () => {
    expect(isLockedFromTimestamp(null, now)).toBe(false);
  });

  it("returns true when the earliest match is in the past", () => {
    const oneHourAgoSeconds = Math.floor(now / 1000) - 3600;
    expect(isLockedFromTimestamp(oneHourAgoSeconds, now)).toBe(true);
  });

  it("returns true at the exact kickoff instant", () => {
    const nowSeconds = Math.floor(now / 1000);
    expect(isLockedFromTimestamp(nowSeconds, nowSeconds * 1000)).toBe(true);
  });

  it("returns false when every match is in the future", () => {
    const oneHourFromNowSeconds = Math.floor(now / 1000) + 3600;
    expect(isLockedFromTimestamp(oneHourFromNowSeconds, now)).toBe(false);
  });
});

describe("isTournamentLocked", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    selectRows.mockReset();
  });

  it("is locked when the earliest match kickoff is in the past", async () => {
    const pastSeconds = Math.floor(Date.now() / 1000) - 3600;
    selectRows.mockResolvedValue([{ min: pastSeconds }]);
    await expect(isTournamentLocked()).resolves.toBe(true);
  });

  it("is not locked when the earliest match kickoff is in the future", async () => {
    const futureSeconds = Math.floor(Date.now() / 1000) + 3600;
    selectRows.mockResolvedValue([{ min: futureSeconds }]);
    await expect(isTournamentLocked()).resolves.toBe(false);
  });

  it("is not locked when there are no matches (MIN is null)", async () => {
    selectRows.mockResolvedValue([{ min: null }]);
    await expect(isTournamentLocked()).resolves.toBe(false);
  });

  it("is not locked when the query returns no rows", async () => {
    selectRows.mockResolvedValue([]);
    await expect(isTournamentLocked()).resolves.toBe(false);
  });
});
