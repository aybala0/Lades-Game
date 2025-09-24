"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("Eksik link: token yok.");
      return;
    }

    async function run() {
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Verify failed");
        setStatus("ok");
        setMsg("Kayıt tamamlandı! Artık oyuna dahilsiniz 🎉");
      } catch (e: any) {
        setStatus("error");
        setMsg(e.message || "Verify failed");
      }
    }
    run();
  }, [token]);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Kayıt Verification</h1>
      {status === "loading" && <p>Doğrulama yapılıyor...</p>}
      {status === "ok" && <p className="text-green-700">{msg}</p>}
      {status === "error" && <p className="text-red-600">{msg}</p>}
    </main>
  );
}