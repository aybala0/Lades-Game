"use client";

import { useState } from "react";
import Link from "next/link";


export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    setErr(null);
    setVerifyUrl(null);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setMsg("Oldu! Verification icin lutfen emailine bak!");
      // For now, also show the verify link (useful until email sending is wired)
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
      setName("");
      setEmail("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signup failed";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Oyuna Katıl</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Adınız <br /> Lütfen tam adınızı girin, diğer oyuncular sizi böyle görecekler!</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email <br /> Oyun içi iletişimimiz böyle olacak</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {verifyUrl && (
          <p className="text-sm">
            Dev shortcut:{" "}
            <a className="underline text-blue-600" href={verifyUrl}>
              Verify link
            </a>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Sign up"}
        </button>
      </form>
    <p className="mt-6">
      <Link href="/" className="underline text-blue-600 hover:text-blue-800">
        ← Return to Home
      </Link>
    </p>
    </main>
  );
}