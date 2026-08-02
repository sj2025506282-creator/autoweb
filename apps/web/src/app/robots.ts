import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/lib/site-utils";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getPublicSiteOrigin();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
  };
}
