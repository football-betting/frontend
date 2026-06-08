import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Transporter } from "nodemailer";
import {
  _internal,
  sendTipReminderEmail,
  type TransportFactory,
} from "@/lib/mail";

const SMTP_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
] as const;

const originalEnv: Record<string, string | undefined> = {};

function captureFactory(): { factory: TransportFactory; sent: unknown[] } {
  const sent: unknown[] = [];
  const factory: TransportFactory = () =>
    ({
      sendMail: async (message: unknown) => {
        sent.push(message);
        return {};
      },
    }) as unknown as Transporter;
  return { factory, sent };
}

beforeEach(() => {
  for (const key of SMTP_KEYS) originalEnv[key] = process.env[key];
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "user@example.com";
  process.env.SMTP_PASS = "s3cret";
  process.env.SMTP_FROM = "WM 2026 <no-reply@example.com>";
});

afterEach(() => {
  for (const key of SMTP_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  _internal.reset();
});

describe("sendTipReminderEmail (branded)", () => {
  it("includes the wordmark, match label, kickoff and dashboard CTA", async () => {
    const { factory, sent } = captureFactory();
    _internal.setTransportFactory(factory);

    await sendTipReminderEmail("player@example.com", {
      matchLabel: "Mexico – South Africa",
      kickoff: "Donnerstag, 11. Juni, 19:00 Uhr",
      predictUrl: "https://wm.example.com/",
    });

    expect(sent).toHaveLength(1);
    const msg = sent[0] as {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
    expect(msg.to).toBe("player@example.com");
    expect(msg.subject).toContain("Mexico – South Africa");
    expect(msg.html).toContain("valantic");
    expect(msg.html).toContain("Mexico – South Africa");
    expect(msg.html).toContain("Donnerstag, 11. Juni, 19:00 Uhr");
    expect(msg.html).toContain('href="https://wm.example.com/"');
    // Plain-text fallback still carries the link.
    expect(msg.text).toContain("https://wm.example.com/");
  });

  it("escapes HTML in dynamic values (no markup injection)", async () => {
    const { factory, sent } = captureFactory();
    _internal.setTransportFactory(factory);

    await sendTipReminderEmail("player@example.com", {
      matchLabel: '<script>alert(1)</script> & "x"',
      kickoff: "k",
      predictUrl: "https://wm.example.com/",
    });

    const html = (sent[0] as { html: string }).html;
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });
});
