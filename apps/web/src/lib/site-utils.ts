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
  const host = headersList.get("x-forwarded-host")?.split(",")[0]?.trim()
    || headersList.get("host")
    || "";
  try {
    return await apiFetch<Restaurant>('/api/site/' + encodeURIComponent(host));
  } catch {
    return null;
  }
});

/** Return the public origin seen by the visitor, including custom domains. */
export const getPublicSiteOrigin = cache(async (): Promise<string> => {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host")?.split(",")[0]?.trim()
    || headersList.get("host")
    || new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://autoweb.app").host;
  const forwardedProtocol = headersList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? forwardedProtocol
    : host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https";

  return `${protocol}://${host}`;
});
