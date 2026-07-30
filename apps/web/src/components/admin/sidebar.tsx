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
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">AutoWeb</h2>
        <p className="text-xs text-gray-400">{user.email}</p>
      </div>
      <nav className="flex-1 p-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-2 px-3 py-2 rounded mb-1 text-sm ${
              pathname === link.href ? "bg-blue-600" : "hover:bg-gray-800"
            }`}>
            <span>{link.icon}</span> {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
