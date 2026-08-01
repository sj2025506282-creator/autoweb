import { getRestaurantFromHost } from "@/lib/site-utils";
import { apiFetch } from "@/lib/api-client";
import { HeroBanner } from "@/components/site/hero-banner";
import { MenuSection } from "@/components/site/menu-section";
import Link from "next/link";
import type { MenuItem } from "@autoweb/shared";
import { getDemoMenu, menuCurrency } from "@/lib/demo-menu";

interface MenuResponse {
  items: (MenuItem & { category_name: string })[];
}

export default async function SiteHomePage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  const menu = await apiFetch<MenuResponse>(
    '/api/restaurants/' + restaurant.id + '/menu'
  );
  const menuItems = menu.items.length > 0 ? menu.items : getDemoMenu(restaurant);
  const featuredItems = menuItems.slice(0, 6);
  const currency = menuCurrency(restaurant);

  return (
    <>
      <HeroBanner restaurant={restaurant} />

      <section className="bg-[#f7f3eb] px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">At the table</p>
          <h2 className="mt-4 font-serif text-4xl text-stone-900 sm:text-6xl">Food with a sense of place</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Familiar flavours, thoughtful sourcing and plates made for sharing. Discover a menu shaped by the season and the neighbourhood.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-6xl">
          <MenuSection items={featuredItems} currency={currency} />
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/menu"
            className="inline-flex border-b border-stone-900 pb-1 text-sm font-semibold text-stone-900 transition hover:text-amber-700"
          >
            View the complete menu →
          </Link>
        </div>
      </section>

      <section className="grid bg-stone-950 text-white lg:grid-cols-2">
        <div className="min-h-[420px] bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" />
        <div className="flex items-center px-6 py-16 sm:px-12 lg:px-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">More than dinner</p>
            <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">A room made for long evenings.</h2>
            <p className="mt-6 text-base leading-8 text-stone-300">
              Come for an unhurried meal, stay for another glass. Our dining room brings together warm hospitality, local character and food worth returning for.
            </p>
            <div className="mt-9 flex flex-wrap gap-6 text-sm text-stone-300">
              <span>Season-led kitchen</span><span>Warm hospitality</span><span>Local character</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-amber-300 px-5 py-16 text-center text-stone-950 sm:py-20">
        <p className="font-serif text-3xl sm:text-5xl">Your table is waiting.</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-700">Join us for lunch, dinner or a celebration worth remembering.</p>
        <Link href="/reserve" className="mt-8 inline-flex bg-stone-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800">
          Make a reservation
        </Link>
      </section>
    </>
  );
}
