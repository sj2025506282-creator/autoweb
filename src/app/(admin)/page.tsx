import { getCurrentUser } from "@/lib/auth";
import { queryFirst } from "@/lib/db";
import { StatsCard } from "@/components/admin/stats-card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await queryFirst<{ total: number; active: number; demo: number }>(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='demo' THEN 1 ELSE 0 END) as demo FROM restaurants"
  );
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Restaurants" value={stats?.total ?? 0} icon="🍽️" />
        <StatsCard title="Active Sites" value={stats?.active ?? 0} icon="🟢" />
        <StatsCard title="Demo Sites" value={stats?.demo ?? 0} icon="🔶" />
      </div>
    </div>
  );
}
