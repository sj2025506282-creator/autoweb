import type { MetadataRoute } from "next";
import { getPublicSiteOrigin, getRestaurantFromHost } from "@/lib/site-utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return [];

  const origin = await getPublicSiteOrigin();
  const lastModified = restaurant.updated_at;

  return [
    { url: origin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/menu`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/contact`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${origin}/reserve`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];
}
