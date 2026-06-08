import { createHash, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getUpcomingMatches } from "@/lib/match";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveAppOrigin } from "@/lib/app-origin";
import {
  getAllReminderSettings,
  getEmailDisabledUserIds,
  getSentKeysForMatches,
  markReminderSent,
} from "@/lib/reminder-store";
import {
  deletePushSubscriptionByEndpoint,
  getPushSubscriptionsByUserIds,
} from "@/lib/push-store";
import { getTipByUserAndMatchIds } from "@/lib/tip";
import { getUserEmailsByIds } from "@/lib/user";
import { sendTipReminderEmail } from "@/lib/mail";
import { buildPushPayload, sendPush } from "@/lib/push";
import {
  activeChannels,
  dueLeadMinutes,
  isValidLeadMinutes,
  shouldMarkDelivery,
} from "@/lib/reminders";

export const dynamic = "force-dynamic";

// Constant-time secret comparison. Both sides are SHA-256-hashed first so the
// buffers are always equal length (32 bytes), avoiding both the early-return
// timing leak of `===` and the length leak of comparing raw strings.
function secretMatches(presented: string, secret: string): boolean {
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

// The cron endpoint is gated by CRON_SECRET. If the secret is unset OR the
// request does not present it, return 401 — there is no unauthenticated path.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return secretMatches(auth.slice("Bearer ".length), secret);
  }
  const header = request.headers.get("x-cron-secret");
  if (header) return secretMatches(header, secret);
  return false;
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

  // Coarse guard so a leaked secret cannot hammer the job. The scheduler runs
  // roughly every ~10 min, well under MAX_ATTEMPTS per window.
  const limit = checkRateLimit("cron", "cron-notifications");
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: "tooManyRequests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : {}),
      },
    });
  }

  const origin = resolveAppOrigin(request);
  if (origin === null) {
    // Production without APP_BASE_URL: predict links would be Host-derived.
    // Fail closed rather than emit poisoned links.
    console.error(
      "[cron/notifications] APP_BASE_URL is unset in production; aborting",
    );
    return new Response(JSON.stringify({ error: "appBaseUrlUnset" }), {
      status: 500,
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

  // Per-user channel state (FE-073): email is on by default unless the user
  // opted out (`reminder_email_off`); push is active when the user has >= 1
  // device subscription. Push fans out to every stored subscription.
  const emailDisabledUserIds = await getEmailDisabledUserIds(userIds);
  const pushSubsByUser = await getPushSubscriptionsByUserIds(userIds);

  let sent = 0;

  for (const [userId, leads] of leadsByUser) {
    const tips = await getTipByUserAndMatchIds(userId, matchIds);
    const tippedMatchIds = new Set<number>();
    for (const t of tips) {
      if (t.matchId !== null) tippedMatchIds.add(t.matchId);
    }

    const channels = activeChannels({
      email: !emailDisabledUserIds.has(userId),
      push: (pushSubsByUser.get(userId)?.length ?? 0) > 0,
    });

    for (const channel of channels) {
      // Dedup is per channel: an email send and a push send for the same slot
      // are tracked independently via the `(user, match, lead, channel)` key.
      for (const m of matches) {
        const userSentKeys = new Set<string>();
        for (const lead of leads) {
          if (sentKeys.has(`${userId}:${m.id}:${lead}:${channel}`)) {
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
          const match = matchById.get(m.id);
          if (!match) continue;
          const label = `${match.homeTeam.name} – ${match.awayTeam.name}`;
          const kickoff = formatKickoff(match.utcDate);
          // Land on the dashboard, where all upcoming matches can be tipped
          // directly, rather than a single match detail page.
          const predictUrl = `${origin}/`;

          // Mark-on-success (FE-066): attempt delivery first, reserve the dedup
          // slot only after it actually succeeds. A failed/targetless attempt
          // leaves the slot open so a later run retries while still in window.
          // One channel failing must not halt the batch.
          let delivered = false;
          if (channel === "email") {
            const email = emailById.get(userId);
            if (!email) continue;
            try {
              await sendTipReminderEmail(email, {
                matchLabel: label,
                kickoff,
                predictUrl,
              });
              delivered = true;
            } catch (error) {
              console.error("[cron/notifications] email send failed", error);
            }
          } else if (channel === "push") {
            const subs = pushSubsByUser.get(userId) ?? [];
            // No device to deliver to: skip entirely. Reserving here would burn
            // the slot and the user would never get pushed once they subscribe.
            if (subs.length === 0) continue;
            const payload = buildPushPayload({
              title: "Tipp-Erinnerung",
              // v1: German push text only, mirroring the email. Per-locale push
              // copy is a future enhancement (locale lives in a cookie, not on
              // the user row — see FE-059).
              body: `Du hast dieses Spiel noch nicht getippt: ${label} — Anpfiff ${kickoff}.`,
              url: predictUrl,
            });
            for (const sub of subs) {
              const result = await sendPush(sub, payload);
              if (result.ok) {
                delivered = true;
              } else if (result.gone) {
                await deletePushSubscriptionByEndpoint(sub.endpoint);
              } else {
                console.error(
                  "[cron/notifications] push send failed",
                  result.statusCode,
                );
              }
            }
          }

          if (!shouldMarkDelivery({ channel, delivered })) continue;

          // Reserve the slot only now. The `(user, match, lead, channel)` unique
          // index still guarantees a successfully-sent slot never re-sends.
          const reserved = await markReminderSent(userId, m.id, lead, channel, now);
          if (reserved) sent += 1;
        }
      }
    }
  }

  return NextResponse.json({ sent });
}

export async function POST(request: NextRequest): Promise<Response> {
  return run(request);
}

// POST-only: a GET would expose the secret in URLs/referrers/logs if a caller
// ever appended it to the query string.
export function GET(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
