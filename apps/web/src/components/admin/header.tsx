"use client";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@autoweb/shared";

export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6">
      <h1 className="font-semibold text-gray-700">Dashboard</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user.role}</span>
        <button onClick={logout}
          className="text-sm text-red-600 hover:underline">Logout</button>
      </div>
    </header>
  );
}
