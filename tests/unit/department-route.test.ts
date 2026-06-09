import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/lib/user", () => ({ updateUserDepartment: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getClientIp: vi.fn(() => "ip"),
}));

import { getCurrentSession } from "@/lib/session";
import { updateUserDepartment } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/user/department/route";

type Session = Awaited<ReturnType<typeof getCurrentSession>>;
type Limit = ReturnType<typeof checkRateLimit>;

function req(body: unknown): Request {
  return new Request("http://localhost/api/user/department", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentSession).mockResolvedValue({
    user: { id: "1" },
  } as Session);
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true } as Limit);
  vi.mocked(updateUserDepartment).mockResolvedValue(undefined);
});

describe("POST /api/user/department", () => {
  it("rejects an unauthenticated request (401)", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({ user: null } as Session);
    const res = await POST(req({ department: "Siegen" }));
    expect(res.status).toBe(401);
    expect(updateUserDepartment).not.toHaveBeenCalled();
  });

  it("rejects an invalid department (400)", async () => {
    const res = await POST(req({ department: "Atlantis" }));
    expect(res.status).toBe(400);
    expect(updateUserDepartment).not.toHaveBeenCalled();
  });

  it("updates a valid department for the session user", async () => {
    const res = await POST(req({ department: "Siegen" }));
    expect(res.status).toBe(200);
    expect(updateUserDepartment).toHaveBeenCalledWith(1, "Siegen");
    expect(await res.json()).toEqual({ success: true, department: "Siegen" });
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false } as Limit);
    const res = await POST(req({ department: "Siegen" }));
    expect(res.status).toBe(429);
    expect(updateUserDepartment).not.toHaveBeenCalled();
  });
});
