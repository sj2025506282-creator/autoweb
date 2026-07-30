import { headers } from "next/headers";
import { cache } from "react";
import { apiFetch } from "./api-client";
import type { Restaurant } from "@autoweb/shared";

/**
 * Resolve the current restaurant from the request hostname.
 * Uses React cache() so multiple calls within the same request only hit API once.
 */
export const getRestaurantFromHost = cache(async (): Promise<Restaurant | null> => {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  try {
    return await apiFetch<Restaurant>('/api/site/' + encodeURIComponent(host));
  } catch {
    return null;
  }
});
