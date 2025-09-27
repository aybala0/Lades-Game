// app/report/confirm/page.tsx

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";


function ConfirmEliminationContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading"|"ok"|"error">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("error");
        setMsg("Missing token.");
        return;
      }
      try {
        const res = await fetch("/api/report/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setState("ok");
          setMsg("Thanks! Your elimination has been confirmed.");
        } else {
          setState("error");
          setMsg(data?.error || "Could not confirm elimination.");
        }
      } catch (e) {
        setState("error");
        setMsg("Network error.");
      }
    };
    run();
  }, [token]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold mb-4">Confirm Elimination</h1>
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

export default function ConfirmEliminationPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ConfirmEliminationContent />
    </Suspense>
  );
}