import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@autoweb/shared";

export default async function SettingsPage() {
  let user: SessionUser | null = null;
  try {
    user = await apiFetch<SessionUser>('/api/auth/me');
  } catch {
    redirect("/login");
  }
  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Settings</h2>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="font-medium capitalize">{user.role}</span>
          </div>
        </div>

        <hr className="my-6" />

        <h3 className="text-lg font-semibold mb-4">Password</h3>
        <p className="text-sm text-gray-500 mb-4">
          Password change will be available in a future update.
        </p>

        <hr className="my-6" />

        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">Main Domain</span>
            <p className="font-medium">{process.env.NEXT_PUBLIC_MAIN_DOMAIN || "autoweb.app"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
