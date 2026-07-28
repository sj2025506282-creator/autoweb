"use client";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/data-table";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

export function RestaurantsTable({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter();

  return (
    <DataTable
      columns={[
        { key: "name", header: "Name" },
        { key: "slug", header: "Slug" },
        {
          key: "status",
          header: "Status",
          render: (r: Restaurant) => (
            <span
              className={`px-2 py-1 text-xs rounded ${
                r.status === "active"
                  ? "bg-green-100 text-green-800"
                  : r.status === "demo"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {r.status}
            </span>
          ),
        },
      ]}
      data={restaurants}
      onRowClick={(r) => router.push(`/restaurants/${r.id}`)}
    />
  );
}
