import type { Restaurant } from "@/types";

interface OpeningHours {
  [day: string]: string;
}

function parseOpeningHours(raw: string): OpeningHours | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as OpeningHours;
    }
    return null;
  } catch {
    return null;
  }
}

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export function ContactCard({
  restaurant,
  fallbackHours,
}: {
  restaurant: Restaurant;
  fallbackHours?: string;
}) {
  const hours = parseOpeningHours(restaurant.opening_hours);
  const displayedHours = hours
    ? DAY_ORDER.filter((day) => typeof hours[day] === "string" && hours[day].trim())
    : [];
  const hasHours = displayedHours.length > 0;
  const hasMap = restaurant.lat !== 0 || restaurant.lng !== 0;

  return (
    <div className="grid overflow-hidden bg-white shadow-xl shadow-stone-900/5 md:grid-cols-2">
      {/* Map embed */}
      {hasMap && (
        <div className="min-h-[280px] overflow-hidden bg-stone-200 sm:min-h-[380px]">
          <iframe
            title="Restaurant location"
            width="100%"
            height="100%"
            className="min-h-[280px] sm:min-h-[380px]"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}&output=embed`}
          />
        </div>
      )}

      {/* Contact details */}
      <div className="space-y-8 p-6 sm:p-10 lg:p-12">
        {/* Address */}
        {restaurant.address && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Address</h3>
            <p className="mt-3 font-serif text-2xl leading-snug text-stone-950">{restaurant.address}</p>
            {restaurant.source_url && (
              <a
                href={restaurant.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block border-b border-stone-400 pb-0.5 text-sm font-semibold text-stone-800 hover:text-amber-700"
              >
                View on Google Maps
              </a>
            )}
          </div>
        )}

        {/* Phone */}
        {restaurant.phone && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Phone</h3>
            <a
              href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
              className="mt-2 inline-block text-lg font-medium text-stone-900 hover:text-amber-700"
            >
              {restaurant.phone}
            </a>
          </div>
        )}

        {/* Email */}
        {restaurant.email && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Email</h3>
            <a
              href={`mailto:${restaurant.email}`}
              className="mt-2 inline-block break-all font-medium text-stone-900 hover:text-amber-700"
            >
              {restaurant.email}
            </a>
          </div>
        )}

        {/* Opening hours */}
        {hasHours && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Opening Hours</h3>
            <table className="w-full text-sm">
              <tbody>
                {displayedHours.map(
                  (day) => (
                      <tr key={day} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-4 font-medium capitalize text-stone-800">
                          {day}
                        </td>
                        <td className="py-2.5 text-right text-stone-600">{hours![day]}</td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
        )}
        {!hasHours && fallbackHours && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Opening Hours</h3>
            <p className="mt-3 font-serif text-2xl text-stone-950">{fallbackHours}</p>
          </div>
        )}

        {/* Fallback if no contact info at all */}
        {!restaurant.address && !restaurant.phone && !restaurant.email && !hasHours && !fallbackHours && (
          <p className="text-stone-500">Contact information coming soon.</p>
        )}
      </div>
    </div>
  );
}
