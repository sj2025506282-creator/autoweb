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

export function ContactCard({ restaurant }: { restaurant: Restaurant }) {
  const hours = parseOpeningHours(restaurant.opening_hours);
  const hasMap = restaurant.lat !== 0 || restaurant.lng !== 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Map embed */}
      {hasMap && (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100 min-h-[300px]">
          <iframe
            title="Restaurant location"
            width="100%"
            height="100%"
            style={{ minHeight: "300px", border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}&output=embed`}
          />
        </div>
      )}

      {/* Contact details */}
      <div className="space-y-6">
        {/* Address */}
        {restaurant.address && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600 leading-relaxed">{restaurant.address}</p>
            {restaurant.source_url && (
              <a
                href={restaurant.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
              >
                View on Google Maps
              </a>
            )}
          </div>
        )}

        {/* Phone */}
        {restaurant.phone && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
            <a
              href={`tel:${restaurant.phone.replace(/[^\d+]/g, "")}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {restaurant.phone}
            </a>
          </div>
        )}

        {/* Email */}
        {restaurant.email && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
            <a
              href={`mailto:${restaurant.email}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {restaurant.email}
            </a>
          </div>
        )}

        {/* Opening hours */}
        {hours && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Opening Hours</h3>
            <table className="w-full text-sm">
              <tbody>
                {DAY_ORDER.map(
                  (day) =>
                    hours[day] && (
                      <tr key={day} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-4 text-gray-700 font-medium capitalize">
                          {day}
                        </td>
                        <td className="py-2 text-gray-600">{hours[day]}</td>
                      </tr>
                    )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback if no contact info at all */}
        {!restaurant.address && !restaurant.phone && !restaurant.email && !hours && (
          <p className="text-gray-500">Contact information coming soon.</p>
        )}
      </div>
    </div>
  );
}
