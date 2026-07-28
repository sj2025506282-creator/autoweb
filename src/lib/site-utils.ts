import { headers } from "next/headers";
import { cache } from "react";
import { queryFirst } from "@/lib/db";
import type { Restaurant } from "@/types";

/**
 * Resolve the current restaurant from the request hostname.
 * Uses React cache() so multiple calls within the same request only hit DB once.
 */
export const getRestaurantFromHost = cache(async (): Promise<Restaurant | null> => {
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Strip port for localhost dev (e.g. localhost:3000 → localhost)
  const hostWithoutPort = host.replace(/:\d+$/, "");

  const mainDomain = process.env.MAIN_DOMAIN || "autoweb.app";

  // Try subdomain pattern: slug.autoweb.app
  if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
    const slug = hostWithoutPort.replace(`.${mainDomain}`, "");
    if (slug) {
      return queryFirst<Restaurant>(
        "SELECT * FROM restaurants WHERE slug = ? AND status IN ('active','demo')",
        [slug]
      );
    }
  }

  // Try custom domain match
  const restaurant = await queryFirst<Restaurant>(
    "SELECT * FROM restaurants WHERE domain_custom = ? AND status IN ('active','demo')",
    [hostWithoutPort]
  );
  if (restaurant) return restaurant;

  // For localhost dev without subdomain: try the _host query param set by middleware
  // (middleware rewrites set _host when the host doesn't match main domain)
  return null;
});
