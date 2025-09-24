"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type ReportOk = {
  ok: true;
  reportId: string;
  nextTargetId: string | null;
  roundEnded: boolean;
  newAssignmentId: string | null;
  newReportToken?: string | null;
};

type ReportResp = ReportOk | { ok: false; error: string };

export default function ReportPage() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportOk | null>(null);


  async function submitReport(tok: string) {
    if (!tok) {
      setError("Missing token.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok }),
      });
      const data: ReportResp = await res.json();
      if (!res.ok || !data.ok) throw new Error((data as any).error || "Report failed");
      setResult(data as ReportOk);
    } catch (e: any) {
      setError(e.message || "Report failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitReport(token);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Report Elimination</h1>

      {tokenFromUrl && (
  <div className="space-y-3 rounded border p-4 bg-gray-50">
    <p>
      You opened a <strong>report link</strong>. If you click confirm, this will
      record an elimination for your current target.
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => submitReport(tokenFromUrl)}
        disabled={loading}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Confirm Elimination"}
      </button>
      <a
        href="/"
        className="rounded border px-4 py-2 hover:bg-gray-100"
        aria-label="Go back without reporting"
      >
        Go back
      </a>
    </div>
    <p className="text-xs text-gray-500">
      Tip: Don’t share this link. Anyone with it can submit on your behalf.
    </p>
  </div>
)}

      {/* If no token in URL, show paste box */}
      {!tokenFromUrl && (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Report Token</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your report token"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Report"}
          </button>
        </form>
      )}

      {loading && tokenFromUrl && <p>Submitting…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded border p-4 bg-gray-50 space-y-2">
          <p className="text-green-700">Report recorded! ✅</p>
          {result.roundEnded ? (
            <p>The game has ended. 🎉</p>
          ) : (
            <>
              <p>Your new report token (for your next elimination):</p>
              {result.newReportToken ? (
                <code className="block break-all bg-white border p-2 rounded">
                  {result.newReportToken}
                </code>
              ) : (
                <p className="text-sm text-gray-600">
                  (A new token will be emailed to you.)
                </p>
              )}
            </>
          )}
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