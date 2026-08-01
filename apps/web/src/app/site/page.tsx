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
  const categorySeen = new Set<string>();
  const featuredItems = menuItems
    .filter((item) => {
      if (categorySeen.has(item.category_name)) return false;
      categorySeen.add(item.category_name);
      return true;
    })
    .slice(0, 6);
  const currency = menuCurrency(restaurant);

  return (
    <>
      <HeroBanner restaurant={restaurant} />

      <div className="overflow-hidden bg-amber-300 py-3 text-stone-950">
        <div className="site-marquee flex w-max items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.24em]">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center gap-8" aria-hidden={copy === 1}>
              <span>Season-led cooking</span><span>✦</span><span>Local character</span><span>✦</span>
              <span>Good wine</span><span>✦</span><span>Long evenings</span><span>✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="overflow-hidden bg-[#f7f3eb] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-lg pb-12 pr-10 sm:pb-16 sm:pr-16">
            <div className="aspect-[4/5] overflow-hidden bg-stone-200">
              <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1516211697506-8360dbcfe9a4?auto=format&fit=crop&w=1200&q=90')] bg-cover bg-center transition duration-700 hover:scale-105" />
            </div>
            <div className="absolute bottom-0 right-0 aspect-square w-36 overflow-hidden border-8 border-[#f7f3eb] bg-stone-300 sm:w-48">
              <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=700&q=90')] bg-cover bg-center" />
            </div>
            <span className="absolute -left-3 top-8 bg-stone-950 px-3 py-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white [writing-mode:vertical-rl]">
              Made in the neighbourhood
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Our point of view</p>
            <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight text-stone-950 sm:text-6xl">
              The best meals feel both familiar and entirely new.
            </h2>
            <div className="mt-8 grid gap-6 border-t border-stone-300 pt-8 sm:grid-cols-2">
              <p className="text-sm leading-7 text-stone-600">
                We cook with the rhythm of the market—choosing honest ingredients and letting each one speak clearly on the plate.
              </p>
              <p className="text-sm leading-7 text-stone-600">
                The result is generous food with local soul, served in a room designed for conversation, celebration and one more glass.
              </p>
            </div>
            <div className="mt-9 flex gap-10">
              <div><strong className="block font-serif text-3xl text-stone-950">Local</strong><span className="text-xs uppercase tracking-wider text-stone-500">by nature</span></div>
              <div><strong className="block font-serif text-3xl text-stone-950">Daily</strong><span className="text-xs uppercase tracking-wider text-stone-500">made fresh</span></div>
              <div><strong className="block font-serif text-3xl text-stone-950">Warm</strong><span className="text-xs uppercase tracking-wider text-stone-500">hospitality</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:py-28">
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

      <section className="grid h-[70vh] min-h-[560px] grid-cols-2 grid-rows-2 gap-1 bg-stone-950 p-1 md:grid-cols-4">
        <div className="col-span-2 row-span-2 overflow-hidden"><div className="h-full bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1500&q=90')] bg-cover bg-center transition duration-700 hover:scale-105" /></div>
        <div className="overflow-hidden"><div className="h-full bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=90')] bg-cover bg-center transition duration-700 hover:scale-105" /></div>
        <div className="overflow-hidden"><div className="h-full bg-[url('https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=900&q=90')] bg-cover bg-center transition duration-700 hover:scale-105" /></div>
        <div className="col-span-2 flex items-center justify-center bg-amber-300 p-6 text-center text-stone-950">
          <div><p className="text-xs font-semibold uppercase tracking-[0.25em]">Come as you are</p><p className="mt-3 font-serif text-3xl italic sm:text-4xl">Leave a little happier.</p></div>
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
