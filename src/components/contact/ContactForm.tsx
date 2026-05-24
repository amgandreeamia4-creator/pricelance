"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please complete all fields.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || "Failed to send message");
      } else {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-green-800">Thanks — your message was sent.</div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-red-800">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          className="mt-1 block w-full rounded-md border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          className="mt-1 block w-full rounded-md border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Message</label>
        <textarea
          className="mt-1 block w-full rounded-md border px-3 py-2 min-h-[120px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSending}
          className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send message"}
        </button>
        <a href="mailto:support@pricelance.com" className="text-sm text-slate-600">Or email us directly</a>
      </div>
    </form>
  );
}
