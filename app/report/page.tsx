"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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

function ReportContent() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportOk | null>(null);

  const [targetName, setTargetName] = useState<string | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const fetchedTargetRef = useRef(false);

  useEffect(() => {
    if (!tokenFromUrl) return;
    if (fetchedTargetRef.current) return;
    fetchedTargetRef.current = true;

    (async () => {
      try {
        setTargetLoading(true);
        setTargetError(null);
        const res = await fetch("/api/target-from-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenFromUrl }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setTargetError(data.error || "Could not fetch target");
          return;
        }
        setTargetName(data.target?.name ?? null);
      } catch (err) {
        setTargetError("Network error");
      } finally {
        setTargetLoading(false);
      }
    })();
  }, [tokenFromUrl]);

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
      if (!res.ok || !data.ok) {
        const msg = "error" in data ? data.error : "Report failed";
        throw new Error(msg);
      }
      setResult(data as ReportOk);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Report failed";
      setError(msg);
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
      <h1 className="text-2xl font-semibold"> Eliminasyon Bildir</h1>

      {tokenFromUrl && (
        <div className="space-y-3 rounded border p-4 bg-gray-50">
          <p>
            Bir eliminasyon linki açtınız. Eğer <strong>Onayla</strong>&apos;ya tıklarsanız, şu anki hedefiniz{" "}
            <strong>
              {targetLoading ? "yükleniyor…" : targetName ?? (targetError ? "(hedef bulunamadı)" : "bilinmiyor")}
            </strong>{" "}
            oyundan elenecektir. Onaylıyor musunuz?
          </p>

          {targetError && (
            <p className="text-sm text-red-600">Hedef bilgisi alınamadı: {targetError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => submitReport(tokenFromUrl)}
              disabled={loading}
              className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Onayla"}
            </button>
            <Link href="/" className="rounded border px-4 py-2 hover:bg-gray-100">Go back</Link>
          </div>
          <p className="text-xs text-gray-500">
            Tip: Bu linki kimseyle paylaşmayın. Bu linke sahip olan biri sizin adınıza oyuncuları eleyebilir.
          </p>
        </div>
      )}

      {/* If no token in URL, show paste box */}
      {!tokenFromUrl && (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Eliminasyon Tokenı</label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Eliminasyon token'ınızı yapıştırın"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="btn"
          >
            {loading ? "Submitting…" : "Onayla"}
          </button>
        </form>
      )}

      {loading && tokenFromUrl && <p>Submitting…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="rounded border p-4 bg-gray-50 space-y-2">
          <p className="text-green-700">Rapor alındı! ✅</p>
          {result.roundEnded ? (
            <p>Oyun bitti! 🎉</p>
          ) : (
            <>
              <p>Yeni rapor tokenınız (bir sonraki eliminasyonunuz için):</p>
              {result.newReportToken ? (
                <code className="block break-all bg-white border p-2 rounded">
                  {result.newReportToken}
                </code>
              ) : (
                <p className="text-sm text-gray-600">
                  (Size yeni bir token emaillenecek)
                </p>
              )}
            </>
          )}
        </div>
      )}

      <p className="mt-6">
        <Link href="/" className="underline text-blue-600 hover:text-blue-800">
          ← Ana Menü
        </Link>
      </p>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6"><p>Loading…</p></main>}>
      <ReportContent />
    </Suspense>
  );
}