export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

type Body = { name?: string; email?: string; message?: string };

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let body: Body = {};
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // fallback for form-encoded
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

    // Validation
    if (!name) {
      console.warn("[contact] validation failed: missing name");
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!email) {
      console.warn("[contact] validation failed: missing email");
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }
    if (!validateEmail(email)) {
      console.warn("[contact] validation failed: invalid email", { email });
      return NextResponse.json({ ok: false, error: "Invalid email address" }, { status: 400 });
    }
    if (!message) {
      console.warn("[contact] validation failed: missing message");
      return NextResponse.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    console.log("[contact] sending email", { name, email });
    const result = await sendContactEmail({ name, email, message });
    if (!result.ok) {
      console.error("[contact] send failed", { error: result.error });
      return NextResponse.json({ ok: false, error: result.error || "Email sending failed" }, { status: 502 });
    }

    console.log("[contact] send success");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[contact] exception", err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

function validateEmail(email: string) {
  // simple regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
