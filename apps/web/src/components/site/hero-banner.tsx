import Link from "next/link";
import type { Restaurant } from "@/types";

export function HeroBanner({ restaurant }: { restaurant: Restaurant }) {
  const background = restaurant.cover_image || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=90";

  return (
    <section className="relative flex min-h-[82vh] items-end overflow-hidden bg-stone-950">
      <div className="absolute inset-0 scale-[1.02] bg-cover bg-center" style={{ backgroundImage: `url(${background})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-32 sm:px-8 md:pb-24">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-amber-300">Local ingredients · Honest cooking</p>
        <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl">
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
    </section>
  );
}
