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
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
