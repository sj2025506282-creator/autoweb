"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker({ restaurantId }: { restaurantId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!restaurantId) return;

    fetch("/backend/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        page: pathname,
        referrer: document.referrer || "",
      }),
    }).catch(() => {
      // silently ignore tracking failures
    });
  }, [pathname, restaurantId]);

  return null;
}
