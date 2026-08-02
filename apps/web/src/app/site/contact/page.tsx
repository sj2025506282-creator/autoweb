import { getPublicSiteOrigin, getRestaurantFromHost } from "@/lib/site-utils";
import { ContactCard } from "@/components/site/contact-card";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { getVerifiedProfile } from "@/lib/verified-profile";

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return { title: "Contact Not Found", robots: { index: false } };

  return generatePageMetadata(restaurant, await getPublicSiteOrigin(), {
    path: "/contact",
    title: "Contact",
    description: `Find the address, opening information, and contact details for ${restaurant.name}.`,
  });
}

export default async function SiteContactPage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;
  const profile = getVerifiedProfile(restaurant);

  return (
    <section className="min-h-screen bg-[#f7f3eb] px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Find us in Lisbon</p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-stone-950 sm:text-7xl">Come say hello</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
          Plan your visit, call the restaurant, or open the verified listing for directions.
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        <ContactCard restaurant={restaurant} fallbackHours={profile?.hours} />
      </div>
    </section>
  );
}
