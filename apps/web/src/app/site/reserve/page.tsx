import { getPublicSiteOrigin, getRestaurantFromHost } from "@/lib/site-utils";
import { ReservationForm } from "@/components/site/reservation-form";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return { title: "Reservations Not Found", robots: { index: false } };

  return generatePageMetadata(restaurant, await getPublicSiteOrigin(), {
    path: "/reserve",
    title: "Reserve a Table",
    description: `Request a table at ${restaurant.name}.`,
  });
}

export default async function SiteReservePage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  return (
    <section className="min-h-screen bg-[#1f3329] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">A seat at our table</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-white sm:text-7xl">Request a table</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-300 sm:text-base">
          Share your preferred date and time. A request is not confirmed until the restaurant accepts it.
        </p>
      </div>

      <div className="mx-auto max-w-2xl bg-[#f7f3eb] p-5 shadow-2xl shadow-black/20 sm:p-10">
        <ReservationForm restaurantId={restaurant.id} restaurantHasEmail={Boolean(restaurant.email?.trim())} />
      </div>
    </section>
  );
}
