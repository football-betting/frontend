import { beforeEach, describe, expect, it, vi } from "vitest";

const { toBufferMock, sharpFactory, mkdirMock, writeFileMock } = vi.hoisted(
  () => {
    const toBufferMock = vi.fn(async () => Buffer.from("webp-bytes"));
    const chain = {
      rotate: vi.fn(() => chain),
      resize: vi.fn(() => chain),
      webp: vi.fn(() => chain),
      toBuffer: toBufferMock,
    };
    return {
      toBufferMock,
      sharpFactory: vi.fn(() => chain),
      mkdirMock: vi.fn(async () => undefined),
      writeFileMock: vi.fn(async () => undefined),
    };
  },
);
vi.mock("sharp", () => ({ default: sharpFactory }));
vi.mock("node:fs/promises", () => ({
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/user", () => ({ updateUserAvatar: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "1.2.3.4"),
  checkRateLimit: vi.fn(() => ({ ok: true })),
}));

import { getCurrentSession } from "@/lib/session";
import { updateUserAvatar } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_AVATAR_BYTES } from "@/lib/avatar";
import { GET, POST } from "@/app/api/user/avatar/route";

type Awaited2<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

function avatarReq(file?: File | string): Request {
  const fd = new FormData();
  if (file !== undefined) fd.set("avatar", file);
  return new Request("http://localhost/api/user/avatar", {
    method: "POST",
    body: fd,
  });
}

function pngFile(bytes = 1024, type = "image/png"): File {
  return new File([new Uint8Array(bytes)], "a.png", { type });
}

function loggedIn(id: string): void {
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id },
    session: {},
  } as unknown as Awaited2<typeof getCurrentSession>);
}

beforeEach(() => {
  vi.clearAllMocks();
  loggedIn("6");
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true });
  toBufferMock.mockResolvedValue(Buffer.from("webp-bytes"));
  vi.mocked(updateUserAvatar).mockResolvedValue(
    undefined as unknown as Awaited2<typeof updateUserAvatar>,
  );
});

describe("user/avatar route", () => {
  it("rejects an anonymous request with 401", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      user: null,
      session: null,
    } as unknown as Awaited2<typeof getCurrentSession>);
    const res = await POST(avatarReq(pngFile()));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "notLoggedIn" });
  });

  it("returns 429 when rate-limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, retryAfter: 4 });
    const res = await POST(avatarReq(pngFile()));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("4");
  });

  it("returns 400 noFileProvided when no file is attached", async () => {
    const res = await POST(avatarReq());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "noFileProvided" });
  });

  it("returns 400 noFileProvided when the field is not a File", async () => {
    const res = await POST(avatarReq("just-a-string"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "noFileProvided" });
  });

  it("returns 413 imageTooLarge for an oversized file", async () => {
    const big = pngFile(MAX_AVATAR_BYTES + 1);
    const res = await POST(avatarReq(big));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "imageTooLarge" });
  });

  it("returns 415 unsupportedImageType for a non-image type", async () => {
    const res = await POST(avatarReq(pngFile(1024, "application/pdf")));
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: "unsupportedImageType" });
  });

  it("returns 400 invalidImage when sharp fails to decode", async () => {
    toBufferMock.mockRejectedValue(new Error("corrupt"));
    const res = await POST(avatarReq(pngFile()));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalidImage" });
  });

  it("processes, stores, and returns a versioned avatar URL (200)", async () => {
    const res = await POST(avatarReq(pngFile()));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; avatar: string };
    expect(body.success).toBe(true);
    expect(body.avatar).toMatch(/^\/uploads\/avatars\/6\.webp\?v=\d+$/);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(updateUserAvatar).toHaveBeenCalledWith(6, body.avatar);
  });

  it("returns 500 failedToSaveAvatar when persisting throws", async () => {
    writeFileMock.mockRejectedValue(new Error("disk full"));
    const res = await POST(avatarReq(pngFile()));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "failedToSaveAvatar" });
  });

  it("GET is 405", () => {
    expect(GET().status).toBe(405);
  });
});
