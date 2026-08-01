"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@autoweb/shared";

const pageTitles: Array<[string, string]> = [
  ["/outreach/review", "Review demos"],
  ["/outreach", "Find leads"],
  ["/restaurants", "Restaurants"],
  ["/templates", "Templates"],
  ["/settings", "Settings"],
  ["/", "Overview"],
];

export function Header({ user }: { user: SessionUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageTitle = pageTitles.find(([path]) => path === "/" ? pathname === "/" : pathname.startsWith(path))?.[1] ?? "AutoWeb";

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/backend/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div>
        <p className="text-xs font-medium text-slate-400">Workspace</p>
        <h1 className="text-sm font-semibold text-slate-900">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700 sm:inline-flex">
          {user.role}
        </span>
        <span aria-hidden="true" className="h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
