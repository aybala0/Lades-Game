// app/report/dispute/DisputeClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DisputeClient({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("error");
        setMsg("Missing token.");
        return;
      }
      try {
        const res = await fetch("/api/report/dispute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) {
          setState("ok");
          setMsg("We recorded your dispute and restored your status.");
        } else {
          setState("error");
          setMsg(data?.error || `Could not record dispute (HTTP ${res.status}).`);
        }
      } catch {
        setState("error");
        setMsg("Network error.");
      }
    };
    run();
  }, [token]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Dispute Elimination</h1>
      {state === "loading" && <p>Processing…</p>}
      {state !== "loading" && (
        <>
          <p className={state === "ok" ? "text-green-700" : "text-red-600"}>{msg}</p>
          <p className="mt-6">
            <Link href="/" className="underline">← Return to Home</Link>
          </p>
        </>
      )}
    </main>
  );
}