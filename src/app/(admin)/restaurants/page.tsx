import Link from "next/link";
import { queryAll } from "@/lib/db";
import { RestaurantsTable } from "./restaurants-table";
import type { Restaurant } from "@/types";

export default async function RestaurantsPage() {
  const restaurants = await queryAll<Restaurant>(
    "SELECT * FROM restaurants ORDER BY created_at DESC"
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Restaurants</h2>
        <Link
          href="/restaurants/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New
        </Link>
      </div>
      <RestaurantsTable restaurants={restaurants} />
    </div>
  );
}
