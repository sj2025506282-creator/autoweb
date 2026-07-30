import { apiFetch } from "@/lib/api-client";
import type { MetadataRoute } from "next";
import type { Restaurant } from "@autoweb/shared";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://autoweb.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const restaurants = await apiFetch<Restaurant[]>('/api/restaurants');
    const activeRestaurants = restaurants.filter(r => r.status === 'active');

    return activeRestaurants.map((r) => ({
      url: `${BASE_URL}/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Return empty sitemap if API is unavailable (e.g., during build)
    return [];
  }
}
