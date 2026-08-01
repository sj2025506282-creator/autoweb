import { getRestaurantFromHost } from "@/lib/site-utils";
import { apiFetch } from "@/lib/api-client";
import { MenuSection } from "@/components/site/menu-section";
import type { MenuItem } from "@autoweb/shared";

interface MenuResponse {
  items: (MenuItem & { category_name: string })[];
}

export default async function SiteMenuPage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  const menu = await apiFetch<MenuResponse>(
    '/api/restaurants/' + restaurant.id + '/menu'
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

      <MenuSection items={menu.items} />
    </section>
  );
}
