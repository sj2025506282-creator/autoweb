import type { Restaurant } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://autoweb.app";

export function generateRestaurantSchema(
  restaurant: Pick<
    Restaurant,
    "name" | "phone" | "email" | "address" | "opening_hours" | "cover_image" | "slug"
  >
) {
  let openingHours: Record<string, string> = {};
  try {
    openingHours = JSON.parse(restaurant.opening_hours || "{}");
  } catch {
    openingHours = {};
  }

  const menuUrl = `${BASE_URL}/${restaurant.slug}/menu`;
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
  restaurant: Pick<Restaurant, "name" | "description" | "cover_image" | "slug">
) {
  const description =
    restaurant.description ||
    `${restaurant.name} — Fresh food, great ambiance. Visit us today!`;
  const url = `${BASE_URL}/${restaurant.slug}`;

  return {
    title: `${restaurant.name} — Restaurant`,
    description,
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
