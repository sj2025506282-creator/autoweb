import { apiFetch } from "@/lib/api-client";
import { StatsCard } from "@/components/admin/stats-card";
import Link from "next/link";
import type { Restaurant } from "@autoweb/shared";

export default async function DashboardPage() {
  const restaurants = await apiFetch<Restaurant[]>('/api/restaurants');
  const total = restaurants.length;
  const active = restaurants.filter(r => r.status === 'active').length;
  const demo = restaurants.filter(r => r.status === 'demo').length;
  const recent = [...restaurants]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const statusStyles: Record<Restaurant["status"], string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    demo: "bg-amber-50 text-amber-700 ring-amber-600/20",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Overview
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Good to see you.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Find promising restaurants, turn them into polished demos, and move approved sites live.
          </p>
        </div>
        <Link
          href="/outreach"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Find a new lead <span className="ml-2">→</span>
        </Link>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard title="Total restaurants" value={total} icon="⌂" detail="All managed properties" tone="slate" />
        <StatsCard title="Active sites" value={active} icon="✓" detail="Published and serving visitors" />
        <StatsCard title="Demos to review" value={demo} icon="◇" detail="Waiting for your decision" tone="amber" />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-semibold text-slate-950">Recently updated</h3>
              <p className="mt-0.5 text-xs text-slate-500">Your latest restaurant projects</p>
            </div>
            <Link href="/restaurants" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-slate-700">No restaurants yet</p>
              <p className="mt-1 text-sm text-slate-500">Search for a lead to create your first demo site.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                >
                  <span className="grid size-10 flex-none place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                    {restaurant.name.trim().charAt(0).toUpperCase() || "R"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{restaurant.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {restaurant.address || `${restaurant.slug}.autoweb`}
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[restaurant.status]}`}>
                    {restaurant.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Workflow</p>
          <h3 className="mt-2 text-xl font-semibold">From lead to live site</h3>
          <div className="mt-6 space-y-5">
            {[
              ["01", "Find a restaurant", "Search Google Maps for businesses without a website.", "/outreach"],
              ["02", "Review the demo", "Check the content and presentation before outreach.", "/outreach/review"],
              ["03", "Publish and follow up", "Approve the site when every detail is ready.", "/restaurants"],
            ].map(([number, title, description, href]) => (
              <Link key={number} href={href} className="group flex gap-4">
                <span className="grid size-9 flex-none place-items-center rounded-full border border-white/15 text-xs font-semibold text-emerald-300 transition group-hover:border-emerald-400">
                  {number}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
