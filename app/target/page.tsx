"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type TargetResp =
  | { ok: true; target: { id: string; name: string; email: string } }
  | { ok: false; error: string };

function TargetContent() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    if (tokenFromUrl) {
      fetchTarget(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function fetchTarget(tok: string) {
    setLoading(true);
    setError(null);
    setTarget(null);
    try {
      const res = await fetch("/api/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok }),
      });
      const data: TargetResp = await res.json();
      if (!res.ok || !data.ok) {
        const msg = "error" in data ? data.error : "Target lookup failed";
        throw new Error(msg);
      }
      setTarget(data.target);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Target lookup failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchTarget(token);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Your Target</h1>

      {!tokenFromUrl && (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Target Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your target token"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Fetching…" : "Show Target"}
          </button>
        </form>
      )}

      {loading && tokenFromUrl && <p>Loading target…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {target && (
        <div className="rounded border p-4 bg-gray-50">
          <p><span className="font-semibold">Name:</span> {target.name}</p>
          <p><span className="font-semibold">Email:</span> {target.email}</p>
          <p className="text-xs text-gray-500 mt-2">Keep this information secret.</p>
        </div>
      )}

      <p className="mt-6">
        <Link href="/" className="underline text-blue-600 hover:text-blue-800">
          ← Return to Home
        </Link>
      </p>
    </main>
  );
}

export default function TargetPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6"><p>Loading…</p></main>}>
      <TargetContent />
    </Suspense>
  );
}