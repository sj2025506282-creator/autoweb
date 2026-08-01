import Link from "next/link";
import type { Restaurant } from "@/types";

export function HeroBanner({ restaurant }: { restaurant: Restaurant }) {
  const background = restaurant.cover_image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=90";

  return (
    <section className="relative flex min-h-[88vh] items-end overflow-hidden bg-stone-950">
      <div className="site-hero-image absolute inset-0 scale-[1.02] bg-cover bg-center" style={{ backgroundImage: `url(${background})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/60 [writing-mode:vertical-rl] lg:flex">
        A table in the heart of the city
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 md:pb-24">
        <div className="site-reveal">
        <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.32em] text-amber-300">
          <span className="h-px w-10 bg-amber-300" /> Local ingredients · Honest cooking
        </p>
        <h1 className="max-w-5xl font-serif text-5xl leading-[0.88] tracking-[-0.04em] text-white sm:text-7xl md:text-[7.5rem]">
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="mt-7 max-w-2xl text-base leading-7 text-stone-200 sm:text-lg">
            {restaurant.description}
          </p>
        )}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center bg-amber-300 px-7 py-3.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
          >
            Explore the menu
          </Link>
          <Link
            href="/reserve"
            className="inline-flex items-center justify-center border border-white/50 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-stone-950"
          >
            Reserve a table
          </Link>
        </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 hidden border-l border-t border-white/20 bg-black/30 px-8 py-5 text-white backdrop-blur-md md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">Reservations</p>
        <p className="mt-1 font-serif text-lg">Lunch · Dinner · Celebrations</p>
      </div>
    </section>
  );
}
