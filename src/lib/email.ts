/**
 * Email service helper
 * Supports Resend API (preferred) and Nodemailer SMTP fallback.
 * Exports `sendContactEmail` which returns { ok: boolean, error?: string }
 */

import type { SendEmailResult } from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM; // recommended verified sender
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL;

// SMTP env vars
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function sendContactEmail({ name, email, message }: { name: string; email: string; message: string; }): Promise<SendEmailResult> {
  console.log("[email] sendContactEmail attempt", { name, email });

  if (!CONTACT_EMAIL) {
    const err = "CONTACT_EMAIL is not configured on the server";
    console.error("[email]", err);
    return { ok: false, error: err };
  }

  const subject = `Contact form: ${name || "(no name)"}`;
  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Message:</strong></p>
    <div>${escapeHtml(message).replace(/\n/g, "<br />")}</div>
  `;

  // Try Resend first
  if (RESEND_API_KEY) {
    try {
      console.log("[email] using Resend API");
      const from = RESEND_FROM || `no-reply@${getHostFromEnv() || "pricelance.com"}`;
      const payload = {
        from,
        to: CONTACT_EMAIL,
        subject,
        html
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = `Resend API error: ${res.status} ${JSON.stringify(data)}`;
        console.error("[email]", err);
        return { ok: false, error: err };
      }

      console.log("[email] resend success", { id: data.id });
      return { ok: true };
    } catch (err: any) {
      console.error("[email] resend exception", err);
      // fallthrough to SMTP
    }
  }

  // SMTP via Nodemailer
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      console.log("[email] using Nodemailer SMTP fallback");
      // lazy import to avoid bundling in client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require("nodemailer");

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      // verify transporter
      await transporter.verify();
      const from = RESEND_FROM || SMTP_USER || `no-reply@${getHostFromEnv() || "pricelance.com"}`;

      const info = await transporter.sendMail({
        from,
        to: CONTACT_EMAIL,
        subject,
        html,
        replyTo: email,
      });

      console.log("[email] nodemailer success", { messageId: info.messageId });
      return { ok: true };
    } catch (err: any) {
      console.error("[email] nodemailer error", err);
      return { ok: false, error: err?.message || String(err) };
    }
  }

  const err = "No email provider configured (RESEND_API_KEY or SMTP_* env vars required)";
  console.error("[email]", err);
  return { ok: false, error: err };
}

function getHostFromEnv() {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL || process.env.APP_BASE_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    return url.hostname;
  } catch (e) {
    return null;
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
