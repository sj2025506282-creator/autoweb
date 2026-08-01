"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@autoweb/shared";

const links = [
  { href: "/", label: "Overview", icon: "⌂" },
  { href: "/restaurants", label: "Restaurants", icon: "▦" },
  { href: "/templates", label: "Templates", icon: "◇" },
  { href: "/outreach", label: "Find leads", icon: "⌕" },
  { href: "/outreach/review", label: "Review demos", icon: "✓" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  return (
    <aside className="w-full flex-shrink-0 bg-slate-950 text-white md:flex md:w-64 md:flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4 md:px-5 md:py-6">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-emerald-500 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20">
          AW
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">AutoWeb</h2>
          <p className="truncate text-xs text-slate-400">Restaurant growth studio</p>
        </div>
      </div>
      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto p-2 md:block md:flex-1 md:p-4">
        {links.map((link) => {
          const isExactRoute = link.href === "/" || link.href === "/outreach";
          const isActive = isExactRoute
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition md:mb-1 ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span aria-hidden="true" className="grid size-5 place-items-center text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-white/10 p-4 md:block">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="grid size-9 flex-none place-items-center rounded-full bg-slate-800 text-xs font-semibold text-emerald-300">
            {user.email.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{user.email}</p>
            <p className="mt-0.5 text-[11px] capitalize text-slate-400">{user.role} account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
