"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@autoweb/shared";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/restaurants", label: "Restaurants", icon: "🍽️" },
  { href: "/templates", label: "Templates", icon: "🎨" },
  { href: "/outreach", label: "Outreach", icon: "🔍" },
  { href: "/outreach/review", label: "Review Demos", icon: "✅" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  return (
    <aside className="w-full flex-shrink-0 bg-gray-900 text-white md:flex md:w-64 md:flex-col">
      <div className="border-b border-gray-700 p-4 md:block">
        <h2 className="text-lg font-bold">AutoWeb</h2>
        <p className="truncate text-xs text-gray-400">{user.email}</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 md:block md:flex-1 md:p-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className={`flex flex-shrink-0 items-center gap-2 rounded px-3 py-2 text-sm md:mb-1 ${
              pathname === link.href ? "bg-blue-600" : "hover:bg-gray-800"
            }`}>
            <span>{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
