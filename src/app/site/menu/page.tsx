import { getRestaurantFromHost } from "@/lib/site-utils";
import { queryAll } from "@/lib/db";
import { MenuSection } from "@/components/site/menu-section";
import type { MenuItem } from "@/types";

export default async function SiteMenuPage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  const items = await queryAll<MenuItem & { category_name: string }>(
    `SELECT mi.*, mc.name as category_name
     FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mc.restaurant_id = ?
     ORDER BY mc.sort_order, mi.sort_order`,
    [restaurant.id]
  );

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Menu</h1>
        <p className="text-gray-500 text-lg">
          Explore our carefully crafted dishes
        </p>
      </div>

      <MenuSection items={items} />
    </section>
  );
}
