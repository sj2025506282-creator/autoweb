import { getRestaurantFromHost } from "@/lib/site-utils";
import { apiFetch } from "@/lib/api-client";
import { HeroBanner } from "@/components/site/hero-banner";
import { MenuSection } from "@/components/site/menu-section";
import Link from "next/link";
import type { MenuItem } from "@autoweb/shared";
import { getDemoMenu, menuCurrency } from "@/lib/demo-menu";
import { getVerifiedProfile } from "@/lib/verified-profile";

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
  const profile = getVerifiedProfile(restaurant);

  return (
    <>
      <HeroBanner restaurant={restaurant} />

      <div className="overflow-hidden bg-amber-300 py-3 text-stone-950">
        <div className="site-marquee flex w-max items-center gap-8 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.24em]">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex items-center gap-8" aria-hidden={copy === 1}>
              <span>{profile?.facts[0] || restaurant.name}</span><span>✦</span><span>{profile?.facts[1] || restaurant.address}</span><span>✦</span>
              <span>{profile?.hours || restaurant.phone}</span><span>✦</span><span>{profile?.facts[2] || restaurant.name}</span><span>✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="overflow-hidden bg-[#f7f3eb] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="relative mx-auto w-full max-w-lg pb-12 pr-10 sm:pb-16 sm:pr-16">
            <div className="aspect-[4/5] overflow-hidden bg-stone-200">
              <div className="grid h-full w-full place-items-center bg-[#1f3329] p-10 text-center text-amber-200">
                <span className="font-serif text-8xl italic">Nossa</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 aspect-square w-36 overflow-hidden border-8 border-[#f7f3eb] bg-stone-300 sm:w-48">
              <div className="grid h-full w-full place-items-center bg-amber-300 font-serif text-5xl text-stone-950">31</div>
            </div>
            <span className="absolute -left-3 top-8 bg-stone-950 px-3 py-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-white [writing-mode:vertical-rl]">
              Made in the neighbourhood
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">About the restaurant</p>
            <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.05] tracking-tight text-stone-950 sm:text-6xl">
              A small family restaurant in historic Lisbon.
            </h2>
            <div className="mt-8 grid gap-6 border-t border-stone-300 pt-8 sm:grid-cols-2">
              <p className="text-sm leading-7 text-stone-600">{profile?.about || restaurant.description}</p>
              <p className="text-sm leading-7 text-stone-600">{profile?.bookingNote || restaurant.address}</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
              {(profile?.facts || []).slice(0, 3).map((fact) => <div key={fact} className="max-w-52"><strong className="block font-serif text-xl leading-snug text-stone-950">{fact}</strong></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">At the table</p>
          <h2 className="mt-4 font-serif text-4xl text-stone-900 sm:text-6xl">Food with a sense of place</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            {profile ? "Dishes designed for sharing, made with seasonal Portuguese ingredients." : restaurant.description}
          </p>
          {profile && (
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-stone-400">
              Dish names are sourced from published listings. Unverified descriptions and AI-generated photography are illustrative demo content pending restaurant approval.
            </p>
          )}
        </div>
        <div className="mx-auto mt-14 max-w-6xl">
          <MenuSection items={featuredItems} currency={currency} />
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/menu"
            className="inline-flex border-b border-stone-900 pb-1 text-sm font-semibold text-stone-900 transition hover:text-amber-700"
          >
            View selected dishes →
          </Link>
        </div>
      </section>

      {profile && <section className="grid bg-stone-950 text-white md:grid-cols-3">
        <div className="p-10 sm:p-14"><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Hours</p><p className="mt-4 font-serif text-3xl">{profile.hours}</p></div>
        <div className="border-y border-white/10 p-10 sm:p-14 md:border-x md:border-y-0"><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Location</p><p className="mt-4 font-serif text-3xl">{restaurant.address}</p></div>
        <div className="p-10 sm:p-14"><p className="text-xs uppercase tracking-[0.2em] text-amber-300">Source</p><a href={profile.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-serif text-3xl underline decoration-amber-300/50 underline-offset-8">Verified listing ↗</a></div>
      </section>}

      <section className="bg-amber-300 px-5 py-16 text-center text-stone-950 sm:py-20">
        <p className="font-serif text-3xl sm:text-5xl">Reserve a table</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-700">{profile?.bookingNote || `Contact ${restaurant.name} to confirm availability.`}</p>
        <Link href="/reserve" className="mt-8 inline-flex bg-stone-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800">
          Make a reservation
        </Link>
      </section>
    </>
  );
}
