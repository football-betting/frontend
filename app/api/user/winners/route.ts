import { getCurrentSession } from "@/lib/session";
import { updateUserWinners } from "@/lib/user";
import { winnersSchema } from "@/lib/validation/winners";
import { isTournamentLocked } from "@/lib/tournament";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function readBody(
  request: Request,
): Promise<{ winner: unknown; secretWinner: unknown } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      return {
        winner: body.winner,
        secretWinner: body.secretWinner,
      };
    }
    const formData = await request.formData();
    return {
      winner: formData.get("winner"),
      secretWinner: formData.get("secretWinner"),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const { user: sessionUser } = await getCurrentSession();
  if (!sessionUser) {
    return jsonError("Not logged in", 401);
  }

  const userId = Number(sessionUser.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return jsonError("Not logged in", 401);
  }

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(ip, "winners");
  if (!limit.ok) {
    return new Response(
      JSON.stringify({ error: "Too many requests, try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...(limit.retryAfter
            ? { "Retry-After": String(limit.retryAfter) }
            : {}),
        },
      },
    );
  }

  if (await isTournamentLocked()) {
    return jsonError(
      "Tournament has already started — picks are locked.",
      400,
    );
  }

  const raw = await readBody(request);
  if (!raw) {
    return jsonError("Invalid request body", 400);
  }

  const parsed = winnersSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "Invalid input";
    return jsonError(message, 400);
  }

  const { winner, secretWinner } = parsed.data;

  try {
    await updateUserWinners(userId, winner, secretWinner);
  } catch (error) {
    console.error("[winners] update failed", error);
    return jsonError("Failed to update winners", 500);
  }

  return new Response(
    JSON.stringify({ success: true, winner, secretWinner }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
