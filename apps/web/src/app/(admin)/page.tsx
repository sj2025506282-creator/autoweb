import { apiFetch } from "@/lib/api-client";
import { StatsCard } from "@/components/admin/stats-card";
import type { Restaurant } from "@autoweb/shared";

export default async function DashboardPage() {
  const restaurants = await apiFetch<Restaurant[]>('/api/restaurants');
  const total = restaurants.length;
  const active = restaurants.filter(r => r.status === 'active').length;
  const demo = restaurants.filter(r => r.status === 'demo').length;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Restaurants" value={total} icon="🍽️" />
        <StatsCard title="Active Sites" value={active} icon="🟢" />
        <StatsCard title="Demo Sites" value={demo} icon="🔶" />
      </div>
    </div>
  );
}
