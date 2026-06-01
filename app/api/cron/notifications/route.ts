import { type NextRequest, NextResponse } from "next/server";
import { getUpcomingMatches } from "@/lib/match";
import {
  getAllReminderSettings,
  getSentKeysForMatches,
  markReminderSent,
} from "@/lib/reminder-store";
import { getTipByUserAndMatchIds } from "@/lib/tip";
import { getUserEmailsByIds } from "@/lib/user";
import { sendTipReminderEmail } from "@/lib/mail";
import { dueLeadMinutes, isValidLeadMinutes } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function resolveOrigin(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return request.nextUrl.origin;
}

// The cron endpoint is gated by CRON_SECRET. If the secret is unset OR the
// request does not present it, return 401 — there is no unauthenticated path.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

function formatKickoff(utcDate: Date): string {
  return (
    utcDate.toLocaleString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    }) + " Uhr"
  );
}

async function run(request: NextRequest): Promise<Response> {
  if (!isAuthorized(request)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const matches = await getUpcomingMatches();
  if (matches.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const settings = await getAllReminderSettings();
  if (settings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const matchById = new Map(matches.map((m) => [m.id, m]));
  const matchIds = matches.map((m) => m.id);

  // Group enabled lead times per user (valid set only).
  const leadsByUser = new Map<number, number[]>();
  for (const s of settings) {
    if (!isValidLeadMinutes(s.leadMinutes)) continue;
    const list = leadsByUser.get(s.userId) ?? [];
    list.push(s.leadMinutes);
    leadsByUser.set(s.userId, list);
  }

  const userIds = Array.from(leadsByUser.keys());
  const emailById = await getUserEmailsByIds(userIds);
  const sentKeys = await getSentKeysForMatches(matchIds);

  const origin = resolveOrigin(request);
  let sent = 0;

  for (const [userId, leads] of leadsByUser) {
    const email = emailById.get(userId);
    if (!email) continue;

    const tips = await getTipByUserAndMatchIds(userId, matchIds);
    const tippedMatchIds = new Set<number>();
    for (const t of tips) {
      if (t.matchId !== null) tippedMatchIds.add(t.matchId);
    }

    for (const m of matches) {
      // Scope the dedup keys this user has already consumed.
      const userSentKeys = new Set<string>();
      for (const lead of leads) {
        if (sentKeys.has(`${userId}:${m.id}:${lead}`)) {
          userSentKeys.add(`${m.id}:${lead}`);
        }
      }

      const due = dueLeadMinutes({
        now,
        match: { id: m.id, utcDate: m.utcDate, status: m.status },
        enabledLeadMinutes: leads,
        tippedMatchIds,
        sentKeys: userSentKeys,
      });

      for (const lead of due) {
        // Reserve the slot first: the unique index makes this the single
        // source of truth for dedup, so a concurrent run cannot double-send.
        const reserved = await markReminderSent(userId, m.id, lead, now);
        if (!reserved) continue;

        const match = matchById.get(m.id);
        if (!match) continue;
        const label = `${match.homeTeam.name} – ${match.awayTeam.name}`;
        try {
          await sendTipReminderEmail(email, {
            matchLabel: label,
            kickoff: formatKickoff(match.utcDate),
            predictUrl: `${origin}/match/${m.id}`,
          });
          sent += 1;
        } catch (error) {
          console.error("[cron/notifications] send failed", error);
        }
      }
    }
  }

  return NextResponse.json({ sent });
}

export async function POST(request: NextRequest): Promise<Response> {
  return run(request);
}

export async function GET(request: NextRequest): Promise<Response> {
  return run(request);
}
