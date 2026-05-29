import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApi } from "@/lib/api";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchApi timing log", () => {
  it("logs method, path and duration on success and returns data", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ table: [] })),
    );

    const data = await fetchApi("rating", { wrappedByKey: "table" });

    expect(data).toEqual([]);
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^\[rust-api\] GET \/rating \d+ms$/),
    );
  });

  it("stays silent in production but still returns data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ table: [] })),
    );

    const data = await fetchApi("rating", { wrappedByKey: "table" });

    expect(data).toEqual([]);
    expect(log).not.toHaveBeenCalled();
  });

  it("logs failure with duration and rethrows on network error", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    await expect(fetchApi("user/5")).rejects.toThrow("boom");
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^\[rust-api\] GET \/user\/5 failed after \d+ms$/),
    );
  });
});
