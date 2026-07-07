/**
 * Email service helper
 * Supports Resend API (preferred) and Nodemailer SMTP fallback.
 * Exports `sendContactEmail` which returns { ok: boolean, error?: string }
 */

import type { SendEmailResult } from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM; // recommended verified sender
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const ENABLE_CONTACT_EMAIL = process.env.ENABLE_CONTACT_EMAIL === "true";

// SMTP env vars
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function sendContactEmail({ name, email, message }: { name: string; email: string; message: string; }): Promise<SendEmailResult> {
  // Structured debug logs
  console.log("[contact] sendContactEmail attempt", { name: String(name || ""), email: maskEmail(String(email || "")) });
  console.log("[contact] ENABLE_CONTACT_EMAIL:", ENABLE_CONTACT_EMAIL);
  console.log("[contact] CONTACT_EMAIL configured:", Boolean(CONTACT_EMAIL));

  // Feature flag: if disabled, do not attempt to send; log and succeed.
  if (!ENABLE_CONTACT_EMAIL) {
    console.log("[contact] Email disabled - using fallback (logging only)");
    // Log message contents for dev debugging (safe: we mask sender email above)
    console.log("[contact] message:", { name: String(name || ""), email: maskEmail(String(email || "")), message: String(message || "") });
    return { ok: true };
  }

  // Safe fallback: if contact recipient is not configured, do not fail the request.
  if (!CONTACT_EMAIL) {
    console.warn("[contact] CONTACT_EMAIL not configured - skipping send and using fallback");
    console.log("[contact] message (no-email-config):", { name: String(name || ""), email: maskEmail(String(email || "")), message: String(message || "") });
    return { ok: true };
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
        // do not fail the request; attempt SMTP fallback
      } else {
        console.log("[email] resend success", { id: data.id });
        return { ok: true };
      }
    } catch (err: any) {
      console.error("[email] resend exception", err);
      // fallthrough to SMTP
    }
  }

  // SMTP via Nodemailer
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    try {
      console.log("[email] using Nodemailer SMTP fallback");
      const nodemailer = await import("nodemailer");

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
      // do not fail the frontend if SMTP fails
      return { ok: true };
    }
  }

  const err = "No email provider configured (RESEND_API_KEY or SMTP_* env vars required)";
  console.warn("[email]", err);
  // Do not block frontend — treat as successful fallback
  return { ok: true };
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

function maskEmail(email: string) {
  if (!email) return "";
  const parts = String(email).split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : "***";
  return `${maskedLocal}@${domain}`;
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
