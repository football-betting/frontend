import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { match } from "@/db/schema";
import { matchImportSchema } from "@/lib/validation/match-import";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function jsonResponse(body: unknown, status: number, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...(extra ?? {}) },
  });
}

function unauthorized(): Response {
  return jsonResponse({ error: "invalid api key" }, 401);
}

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: "method not allowed" }), {
    status: 405,
    headers: { ...JSON_HEADERS, Allow: "POST" },
  });
}

function verifyApiKey(request: Request): Response | null {
  const configured = process.env.MATCH_IMPORT_API_KEY ?? "";
  if (configured.length === 0) {
    console.error("[match/import] MATCH_IMPORT_API_KEY is not configured");
    return jsonResponse({ error: "server misconfigured" }, 500);
  }

  const provided = request.headers.get("x-api-key") ?? "";
  const expected = Buffer.from(configured);
  const got = Buffer.from(provided);

  if (got.length !== expected.length) {
    return unauthorized();
  }
  if (!timingSafeEqual(got, expected)) {
    return unauthorized();
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(
      { error: "invalid payload", issues: [{ message: "invalid JSON" }] },
      400,
    );
  }

  const parsed = matchImportSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "invalid payload", issues: parsed.error.issues },
      400,
    );
  }

  const data = parsed.data;
  const utcDate = new Date(data.utcDate * 1000);

  const values = {
    id: data.id,
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    status: data.status,
    utcDate,
    score: data.score ?? null,
    homeScore: data.homeScore ?? null,
    awayScore: data.awayScore ?? null,
  };

  try {
    await db
      .insert(match)
      .values(values)
      .onConflictDoUpdate({
        target: match.id,
        set: {
          homeTeam: values.homeTeam,
          awayTeam: values.awayTeam,
          status: values.status,
          utcDate: values.utcDate,
          score: values.score,
          homeScore: values.homeScore,
          awayScore: values.awayScore,
        },
      });
  } catch (error) {
    console.error("[match/import] upsert failed", error);
    return jsonResponse({ error: "upsert failed" }, 500);
  }

  return jsonResponse({ ok: true, id: data.id }, 200);
}

export function GET(): Response {
  return methodNotAllowed();
}

export function HEAD(): Response {
  return methodNotAllowed();
}

export function PUT(): Response {
  return methodNotAllowed();
}

export function DELETE(): Response {
  return methodNotAllowed();
}

export function PATCH(): Response {
  return methodNotAllowed();
}
