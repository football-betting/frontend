import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Transporter } from "nodemailer";
import {
  _internal,
  sendMail,
  sendPasswordResetEmail,
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

function setEnv(env: Partial<Record<(typeof SMTP_KEYS)[number], string>>): void {
  for (const key of SMTP_KEYS) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

interface CapturedTransport {
  options: unknown;
  sent: unknown[];
}

function fakeFactory(): { factory: TransportFactory; captured: CapturedTransport } {
  const captured: CapturedTransport = { options: undefined, sent: [] };
  const factory: TransportFactory = (options) => {
    captured.options = options;
    return {
      sendMail: async (message: unknown) => {
        captured.sent.push(message);
        return {};
      },
    } as unknown as Transporter;
  };
  return { factory, captured };
}

beforeEach(() => {
  for (const key of SMTP_KEYS) {
    originalEnv[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of SMTP_KEYS) {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  }
  _internal.reset();
});

describe("mailer SMTP config", () => {
  it("derives transport options from env (port 587 → secure false)", () => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "user@example.com",
      SMTP_PASS: "s3cret",
      SMTP_FROM: "Pool <no-reply@example.com>",
    });

    const config = _internal.readSmtpConfig();
    expect(config).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "user@example.com", pass: "s3cret" },
      from: "Pool <no-reply@example.com>",
    });
  });

  it("uses secure transport when SMTP_SECURE=true (port 465)", () => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "user",
      SMTP_PASS: "pass",
      SMTP_FROM: "from@example.com",
    });

    expect(_internal.readSmtpConfig().secure).toBe(true);
    expect(_internal.readSmtpConfig().port).toBe(465);
  });

  it("throws a clear error when SMTP env is missing (no secret leak)", () => {
    setEnv({ SMTP_HOST: "smtp.example.com" });
    expect(() => _internal.readSmtpConfig()).toThrowError(/missing/i);
  });
});

describe("mailer send (mocked transport)", () => {
  beforeEach(() => {
    setEnv({
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "user@example.com",
      SMTP_PASS: "s3cret",
      SMTP_FROM: "Pool <no-reply@example.com>",
    });
  });

  it("builds the transport from env and sends with the configured from", async () => {
    const { factory, captured } = fakeFactory();
    _internal.setTransportFactory(factory);

    await sendMail({ to: "a@b.com", subject: "Hi", text: "body" });

    expect(captured.options).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "user@example.com", pass: "s3cret" },
    });
    expect(captured.sent).toHaveLength(1);
    const message = captured.sent[0] as Record<string, unknown>;
    expect(message.from).toBe("Pool <no-reply@example.com>");
    expect(message.to).toBe("a@b.com");
  });

  it("password reset email contains the raw reset url and no secrets", async () => {
    const { factory, captured } = fakeFactory();
    _internal.setTransportFactory(factory);

    const url = "https://app.example.com/reset-password?token=deadbeef";
    await sendPasswordResetEmail("user@example.com", url);

    const message = captured.sent[0] as Record<string, unknown>;
    const serialized = JSON.stringify(message);
    expect(serialized).toContain(url);
    expect(serialized).not.toContain("s3cret");
  });
});
