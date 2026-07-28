import { getRestaurantFromHost } from "@/lib/site-utils";
import { queryAll } from "@/lib/db";
import { HeroBanner } from "@/components/site/hero-banner";
import { MenuSection } from "@/components/site/menu-section";
import Link from "next/link";
import type { MenuItem } from "@/types";

export default async function SiteHomePage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  const featuredItems = await queryAll<MenuItem & { category_name: string }>(
    `SELECT mi.*, mc.name as category_name
     FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mc.restaurant_id = ?
     ORDER BY mi.sort_order
     LIMIT 6`,
    [restaurant.id]
  );

  return (
    <>
      <HeroBanner restaurant={restaurant} />

      {/* Featured menu section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Our Menu
        </h2>
        <p className="text-center text-gray-500 mb-10">
          A taste of what we offer
        </p>
        <MenuSection items={featuredItems} />
        <div className="text-center mt-10">
          <Link
            href="/menu"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Menu
          </Link>
        </div>
      </section>
    </>
  );
}
