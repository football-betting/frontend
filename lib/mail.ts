import "server-only";
import { createTransport, type Transporter } from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: string;
}

function readSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  const missing: string[] = [];
  if (!host) missing.push("SMTP_HOST");
  if (!portRaw) missing.push("SMTP_PORT");
  if (!user) missing.push("SMTP_USER");
  if (!pass) missing.push("SMTP_PASS");
  if (!from) missing.push("SMTP_FROM");
  if (missing.length > 0) {
    throw new Error(`Mailer is not configured: missing ${missing.join(", ")}`);
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Mailer is not configured: SMTP_PORT must be a port number");
  }

  const secure = (process.env.SMTP_SECURE ?? "").toLowerCase() === "true";

  return {
    host: host as string,
    port,
    secure,
    auth: { user: user as string, pass: pass as string },
    from: from as string,
  };
}

export type TransportFactory = (options: {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}) => Transporter;

let transportFactory: TransportFactory = createTransport;
let cachedTransport: Transporter | null = null;
let cachedFrom: string | null = null;

function getTransport(): { transport: Transporter; from: string } {
  if (cachedTransport && cachedFrom) {
    return { transport: cachedTransport, from: cachedFrom };
  }
  const config = readSmtpConfig();
  cachedTransport = transportFactory({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
  cachedFrom = config.from;
  return { transport: cachedTransport, from: cachedFrom };
}

export const _internal = {
  readSmtpConfig,
  setTransportFactory(factory: TransportFactory): void {
    transportFactory = factory;
    cachedTransport = null;
    cachedFrom = null;
  },
  reset(): void {
    transportFactory = createTransport;
    cachedTransport = null;
    cachedFrom = null;
  },
};

export async function sendMail(message: MailMessage): Promise<void> {
  const { transport, from } = getTransport();
  try {
    await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch {
    throw new Error("Failed to send email");
  }
}

export interface TipReminderDetails {
  matchLabel: string;
  kickoff: string;
  predictUrl: string;
}

// Dynamic values land inside HTML attributes/text — escape them. Team names come
// from the external football API, so treat them as untrusted.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Branded HTML email matching the app (dark surface, coral primary, "WM '26 —
// a valantic guessing game" wordmark). Table layout + inline styles so it
// renders across email clients, which strip <style> and flexbox.
function buildTipReminderHtml(details: TipReminderDetails): string {
  const matchLabel = escapeHtml(details.matchLabel);
  const kickoff = escapeHtml(details.kickoff);
  const href = escapeHtml(details.predictUrl);
  return `<!doctype html>
<html lang="de">
<body style="margin:0;padding:0;background:#121317;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#121317;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1e1f23;border:1px solid #343539;border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 28px 18px 28px;text-align:center;border-bottom:1px solid #2a2b2f;">
<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:30px;line-height:1;color:#e3e2e7;letter-spacing:-0.5px;">WM &rsquo;26</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9c9aa1;margin-top:8px;">a <span style="color:#ffffff;font-weight:800;">valantic</span> guessing game</div>
</td></tr>
<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0 0 18px 0;font-size:15px;color:#c8c6cb;">Du hast dieses Spiel noch nicht getippt:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#292a2e;border:1px solid #343539;border-radius:12px;">
<tr><td style="padding:18px 20px;">
<div style="font-size:18px;font-weight:700;color:#e3e2e7;">${matchLabel}</div>
<div style="font-size:13px;color:#a0a0a6;margin-top:6px;">Anpfiff: ${kickoff}</div>
</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 4px auto;">
<tr><td align="center" style="border-radius:12px;background:#ffb4aa;">
<a href="${href}" style="display:inline-block;padding:14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:#690003;text-decoration:none;border-radius:12px;">Jetzt tippen</a>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:16px 28px 26px 28px;text-align:center;border-top:1px solid #2a2b2f;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6c6a70;">Diese Erinnerung kannst du in den Einstellungen anpassen.</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// v1: German email only. Honoring per-user locale is a future enhancement —
// the active locale lives in a cookie, not on the user row (see FE-059).
export async function sendTipReminderEmail(
  to: string,
  details: TipReminderDetails,
): Promise<void> {
  const { matchLabel, kickoff, predictUrl } = details;
  const subject = `Tipp-Erinnerung: ${matchLabel}`;
  const text =
    `Du hast dieses Spiel noch nicht getippt:\n\n` +
    `${matchLabel}\nAnpfiff: ${kickoff}\n\n` +
    `Jetzt tippen:\n${predictUrl}\n`;
  const html = buildTipReminderHtml(details);
  await sendMail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const subject = "Reset your password";
  const text =
    "We received a request to reset your password.\n\n" +
    `Open this link to choose a new password:\n${resetUrl}\n\n` +
    "This link is valid for 60 minutes. If you did not request a reset, " +
    "you can safely ignore this email.";
  const html =
    `<p>We received a request to reset your password.</p>` +
    `<p><a href="${resetUrl}">Choose a new password</a></p>` +
    `<p>This link is valid for 60 minutes. If you did not request a reset, ` +
    `you can safely ignore this email.</p>`;
  await sendMail({ to, subject, text, html });
}
