import { getRestaurantFromHost } from "@/lib/site-utils";
import { apiFetch } from "@/lib/api-client";
import { MenuSection } from "@/components/site/menu-section";
import type { MenuItem } from "@autoweb/shared";
import { getDemoMenu, menuCurrency, NOSSA_CASA_MENU_SOURCE } from "@/lib/demo-menu";

interface MenuResponse {
  items: (MenuItem & { category_name: string })[];
}

export default async function SiteMenuPage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  const menu = await apiFetch<MenuResponse>(
    '/api/restaurants/' + restaurant.id + '/menu'
  );
  const items = menu.items.length > 0 ? menu.items : getDemoMenu(restaurant);
  const categoryCount = new Set(items.map((item) => item.category_name)).size;
  const usesVerifiedListing = menu.items.length === 0 && items.length > 0;

  return (
    <section className="min-h-screen bg-[#f7f3eb] px-5 py-16 sm:py-24">
      {/* Page header */}
      <div className="text-center mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Seasonal & rotating</p>
        <h1 className="font-serif text-5xl text-stone-900 sm:text-7xl">Our Menu</h1>
        <p className="mx-auto mt-5 max-w-xl text-stone-600">
          The restaurant changes its menu regularly. Only currently verifiable published dishes are shown here.
        </p>
        {usesVerifiedListing && (
          <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-stone-400">
            Dish names are sourced from published listings. Unverified descriptions and AI-generated photography are illustrative demo content pending restaurant approval.
          </p>
        )}
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          {items.length} sourced dishes · {categoryCount} section{categoryCount === 1 ? "" : "s"}
        </p>
        {usesVerifiedListing && (
          <a href={NOSSA_CASA_MENU_SOURCE} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-block text-xs font-semibold text-amber-700 underline underline-offset-4">
            View menu evidence ↗
          </a>
        )}
      </div>
      <div className="mx-auto max-w-6xl">
        <MenuSection items={items} currency={menuCurrency(restaurant)} />
      </div>
    </section>
  );
}
