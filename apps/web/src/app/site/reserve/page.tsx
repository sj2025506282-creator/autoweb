import { getRestaurantFromHost } from "@/lib/site-utils";
import { ReservationForm } from "@/components/site/reservation-form";

export default async function SiteReservePage() {
  const restaurant = await getRestaurantFromHost();
  if (!restaurant) return null;

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reserve a Table</h1>
        <p className="text-gray-500 text-lg">
          Book your dining experience with us
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <ReservationForm restaurantId={restaurant.id} />
      </div>
    </section>
  );
}
