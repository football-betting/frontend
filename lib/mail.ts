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
  const html =
    `<p>Du hast dieses Spiel noch nicht getippt:</p>` +
    `<p><strong>${matchLabel}</strong><br>Anpfiff: ${kickoff}</p>` +
    `<p><a href="${predictUrl}">Jetzt tippen</a></p>`;
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
