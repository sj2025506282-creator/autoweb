import { queryAll } from "@/lib/db";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://autoweb.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const restaurants = await queryAll<{ slug: string; updated_at: string }>(
      "SELECT slug, updated_at FROM restaurants WHERE status = 'active'"
    );

    return restaurants.map((r) => ({
      url: `${BASE_URL}/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Return empty sitemap if DB is unavailable (e.g., during build)
    return [];
  }
}
