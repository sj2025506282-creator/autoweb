import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import type { SessionUser } from "@autoweb/shared";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: SessionUser | null = null;
  try {
    user = await apiFetch<SessionUser>('/api/auth/me');
  } catch {
    redirect("/login");
  }
  if (!user) { redirect("/login"); }
  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
