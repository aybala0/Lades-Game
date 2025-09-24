import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function AdminHome() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login?callbackUrl=/admin");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Admin Dashboard</h1>
      <p className="text-sm text-gray-600">You’re logged in as {session.user?.email ?? "unknown"}</p>

      <form action="/api/admin/start-round" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Start Game
        </button>
      </form>

      <form action="/api/admin/end-game" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
        >
          End Game
        </button>
      </form>
      
      <form action="/api/admin/clear-game" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Clear Game
        </button>
      </form>

      <form action="/api/admin/send-update" method="post" className="mt-6">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Send Update Email to All Players
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