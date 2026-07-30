import { getRestaurantFromHost } from "@/lib/site-utils";
import { ContactCard } from "@/components/site/contact-card";

export default async function SiteContactPage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-500 text-lg">
          We would love to hear from you
        </p>
      </div>

      <ContactCard restaurant={restaurant} />
    </section>
  );
}
