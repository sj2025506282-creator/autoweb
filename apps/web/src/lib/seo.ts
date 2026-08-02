import type { Metadata } from "next";
import type { Restaurant } from "@/types";

export function generateRestaurantSchema(
  restaurant: Pick<
    Restaurant,
    "name" | "phone" | "email" | "address" | "opening_hours" | "cover_image" | "slug"
  >,
  origin: string,
) {
  let openingHours: Record<string, string> = {};
  try {
    openingHours = JSON.parse(restaurant.opening_hours || "{}");
  } catch {
    openingHours = {};
  }

  const restaurantUrl = origin;
  const menuUrl = `${origin}/menu`;
  const imageUrl = restaurant.cover_image || "";

  const openingHoursSpecification = Object.entries(openingHours).map(
    ([day, hours]) => {
      const parts = hours.split("-");
      return {
        "@type": "OpeningHoursSpecification" as const,
        dayOfWeek: day,
        opens: parts[0]?.trim() ?? "",
        closes: parts[1]?.trim() ?? "",
      };
    }
  );

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${restaurantUrl}/#restaurant`,
    url: restaurantUrl,
    name: restaurant.name,
    telephone: restaurant.phone,
    email: restaurant.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
    },
    servesCuisine: "Various",
    menu: menuUrl,
    image: imageUrl,
    ...(openingHoursSpecification.length > 0 && {
      openingHoursSpecification,
    }),
  };
}

export function generateMetadata(
  restaurant: Pick<Restaurant, "name" | "description" | "cover_image" | "slug">,
  origin: string,
): Metadata {
  const description =
    restaurant.description ||
    `${restaurant.name} — Fresh food, great ambiance. Visit us today!`;
  const url = origin;

  return {
    title: `${restaurant.name} — Restaurant`,
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: url },
    openGraph: {
      title: restaurant.name,
      description,
      url,
      type: "website" as const,
      ...(restaurant.cover_image && {
        images: [{ url: restaurant.cover_image }],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title: restaurant.name,
      description,
      ...(restaurant.cover_image && {
        images: [restaurant.cover_image],
      }),
    },
  };
}


export function generatePageMetadata(
  restaurant: Pick<Restaurant, "name" | "description" | "cover_image">,
  origin: string,
  page: { path: string; title: string; description: string },
): Metadata {
  const url = `${origin}${page.path}`;

  return {
    title: `${page.title} | ${restaurant.name}`,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} | ${restaurant.name}`,
      description: page.description,
      url,
      type: "website",
      siteName: restaurant.name,
      ...(restaurant.cover_image && { images: [{ url: restaurant.cover_image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | ${restaurant.name}`,
      description: page.description,
      ...(restaurant.cover_image && { images: [restaurant.cover_image] }),
    },
  };
}
