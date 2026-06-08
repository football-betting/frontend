import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchApi } from "@/lib/api";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

function errorResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
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
      expect.stringMatching(/^\[rust-api\] GET \/rating → \d+ in \d+ms$/),
    );
  });

  it("also logs in production (visible in the server/PM2 log)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ table: [] })),
    );

    const data = await fetchApi("rating", { wrappedByKey: "table" });

    expect(data).toEqual([]);
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^\[rust-api\] GET \/rating → \d+ in \d+ms$/),
    );
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
      expect.stringMatching(
        /^\[rust-api\] GET \/user\/5 → failed in \d+ms \(network error\)$/,
      ),
    );
  });
});

describe("fetchApi URL building and options", () => {
  it("strips a leading slash from the endpoint and a trailing slash from RUST_API_URL", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("RUST_API_URL", "http://api.example.com/");
    const fetchMock = vi.fn(async () => jsonResponse({ value: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchApi("/game/9");

    expect(fetchMock).toHaveBeenCalledWith("http://api.example.com/game/9");
  });

  it("falls back to localhost:8080 when RUST_API_URL is unset", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("RUST_API_URL", undefined);
    const fetchMock = vi.fn(async () => jsonResponse({ value: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchApi("rating");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/rating");
  });

  it("returns the raw payload when no wrappedByKey or schema is given", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ a: 1 })));

    await expect(fetchApi("x")).resolves.toEqual({ a: 1 });
  });

  it("accepts the legacy string signature as wrappedByKey", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ table: [1, 2] })));

    await expect(fetchApi("rating", "table")).resolves.toEqual([1, 2]);
  });
});

describe("fetchApi error paths", () => {
  it("throws with status and statusText when the response is not ok", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => errorResponse(503, "Service Unavailable")),
    );

    await expect(fetchApi("rating")).rejects.toThrow(
      /fetchApi: 503 Service Unavailable for/,
    );
  });

  it("throws when wrappedByKey is missing from the response object", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ other: [] })));

    await expect(
      fetchApi("rating", { wrappedByKey: "table" }),
    ).rejects.toThrow(/response missing key 'table'/);
  });

  it("throws when the response is not an object but a key is expected", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(null)));

    await expect(
      fetchApi("rating", { wrappedByKey: "table" }),
    ).rejects.toThrow(/response missing key 'table'/);
  });
});

describe("fetchApi schema validation", () => {
  const schema = z.object({ id: z.number() });

  it("returns parsed data when the schema accepts the payload", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: 7 })));

    await expect(fetchApi("game/7", { schema })).resolves.toEqual({ id: 7 });
  });

  it("validates the unwrapped candidate when both wrappedByKey and schema are set", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ data: { id: 7 } })),
    );

    await expect(
      fetchApi("game/7", { wrappedByKey: "data", schema }),
    ).resolves.toEqual({ id: 7 });
  });

  it("throws a schema-validation error when the payload does not match", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: "no" })));

    await expect(fetchApi("game/7", { schema })).rejects.toThrow(
      /schema validation failed for/,
    );
  });
});
