import type { Metadata } from "next";
import { getPublicSiteOrigin, getRestaurantFromHost } from "@/lib/site-utils";
import { generateMetadata as buildMetadata, generateRestaurantSchema } from "@/lib/seo";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";

export async function generateMetadata(): Promise<Metadata> {
  const restaurant = await getRestaurantFromHost();

  if (!restaurant) {
    return {
      title: "Restaurant Not Found",
      description: "The restaurant site you are looking for does not exist.",
    };
  }

  return buildMetadata(restaurant, await getPublicSiteOrigin());
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const restaurant = await getRestaurantFromHost();

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Site Not Found</h1>
          <p className="text-gray-500 text-lg">
            The restaurant site you are looking for does not exist or is not currently active.
          </p>
        </div>
      </div>
    );
  }

  const schema = generateRestaurantSchema(restaurant, await getPublicSiteOrigin());

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar restaurantName={restaurant.name} />
      <main className="flex-1">{children}</main>
      <Footer restaurantName={restaurant.name} address={restaurant.address} isDemo={restaurant.status === "demo"} />
      <AnalyticsTracker restaurantId={restaurant.id} />
    </div>
  );
}
