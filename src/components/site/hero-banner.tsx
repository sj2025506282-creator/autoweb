import Link from "next/link";
import type { Restaurant } from "@/types";

export function HeroBanner({ restaurant }: { restaurant: Restaurant }) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Cover image background */}
      {restaurant.cover_image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${restaurant.cover_image})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          {restaurant.name}
        </h1>
        {restaurant.description && (
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            {restaurant.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/menu"
            className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            View Our Menu
          </Link>
          <Link
            href="/reserve"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Make a Reservation
          </Link>
        </div>
      </div>
    </section>
  );
}
