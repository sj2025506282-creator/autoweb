import { getStats } from "@/lib/analytics";
import { queryFirst } from "@/lib/db";
import { notFound } from "next/navigation";
import { StatsCard } from "@/components/admin/stats-card";
import type { Restaurant } from "@/types";

interface ByDay {
  day: string;
  views: number;
}

interface TopItem {
  page?: string;
  referrer?: string;
  views: number;
}

function BarChart({ data }: { data: ByDay[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No daily data yet
      </p>
    );
  }

  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="flex items-end gap-1 h-48">
      {data
        .slice()
        .reverse()
        .map((d) => {
          const heightPct = (d.views / maxViews) * 100;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={`${d.day}: ${d.views} views`}
            >
              <span className="text-[10px] text-gray-500 mb-1">
                {d.views}
              </span>
              <div
                className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors min-h-[2px]"
                style={{ height: `${Math.max(heightPct, 1)}%` }}
              />
              <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
                {d.day.slice(5)}
              </span>
            </div>
          );
        })}
    </div>
  );
}

function TopList({
  title,
  items,
  keyField,
}: {
  title: string;
  items: TopItem[];
  keyField: "page" | "referrer";
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
        <p className="text-sm text-gray-400">No data</p>
      </div>
    );
  }

  const maxViews = Math.max(...items.map((i) => i.views), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const value =
            keyField === "page" ? item.page || "/" : item.referrer || "direct";
          const barPct = (item.views / maxViews) * 100;
          return (
            <li key={idx} className="text-sm">
              <div className="flex justify-between text-gray-800 mb-0.5">
                <span className="truncate max-w-[200px]">{value}</span>
                <span className="text-gray-500 ml-2">{item.views}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await queryFirst<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ?",
    [id]
  );

  if (!restaurant) {
    notFound();
  }

  const stats = await getStats(id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Analytics</h2>
          <p className="text-sm text-gray-500">{restaurant.name}</p>
        </div>
      </div>

      {/* PV / UV cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatsCard title="Total Page Views" value={stats.pv.toLocaleString()} icon="📄" />
        <StatsCard title="Unique Visitors" value={stats.uv.toLocaleString()} icon="👤" />
      </div>

      {/* 30-day chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Daily Page Views (Last 30 Days)
        </h3>
        <BarChart data={stats.byDay} />
      </div>

      {/* Top pages + referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <TopList title="Top Pages" items={stats.topPages} keyField="page" />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <TopList
            title="Top Referrers"
            items={stats.topReferrers}
            keyField="referrer"
          />
        </div>
      </div>
    </div>
  );
}
