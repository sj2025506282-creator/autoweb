"use client";

import { SessionUser } from "@/lib/auth";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
      <div className="text-lg font-bold mb-6">AutoWeb</div>
      <nav className="flex flex-col gap-2 flex-1">
        <a href="/" className="px-3 py-2 rounded hover:bg-gray-700">
          Dashboard
        </a>
        <a href="/restaurants" className="px-3 py-2 rounded hover:bg-gray-700">
          Restaurants
        </a>
        <a href="/menus" className="px-3 py-2 rounded hover:bg-gray-700">
          Menus
        </a>
        <a href="/settings" className="px-3 py-2 rounded hover:bg-gray-700">
          Settings
        </a>
      </nav>
      <div className="text-sm text-gray-400 border-t border-gray-700 pt-4">
        {user.email}
      </div>
    </aside>
  );
}
