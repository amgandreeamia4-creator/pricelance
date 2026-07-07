export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

type Body = { name?: string; email?: string; message?: string };

export async function POST(req: Request) {
  console.log("[contact] POST received", { deployment: process.env.VERCEL_DEPLOYMENT_ID || null });

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Body = {};
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        message: String(form.get("message") || "").trim(),
      };
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();

    // Validation (name and message required; email optional)
    if (!name) {
      console.warn("[contact] validation failed: missing name");
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!message) {
      console.warn("[contact] validation failed: missing message");
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    // Contact submissions are accepted without persistence in this release.
    // The email step remains optional and non-blocking.
    console.log("[contact] accepted message without persistence");

    // Try to send email (optional, non-blocking)
    (async () => {
      try {
        console.log("[contact] email feature enabled check");
        const res = await sendContactEmail({ name, email, message });
        if (res.ok) {
          console.log("[contact] email send success (non-blocking)");
        } else {
          console.warn("[contact] email send failed (non-blocking)", { error: res.error });
        }
      } catch (e: any) {
        console.error("[contact] email send exception (non-blocking)", e);
      }
    })();

    // Always return success once the message has been accepted.
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] exception", err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

