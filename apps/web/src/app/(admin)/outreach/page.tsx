"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItemInput {
  name: string;
  price: string;
}

interface PlaceLead {
  placeId: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  googleMapsUrl: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number;
  businessStatus: string;
  hasWebsite: boolean;
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  description: "",
  lat: "",
  lng: "",
  imageUrl: "",
  googlePlaceId: "",
  sourceUrl: "",
};

export default function OutreachPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceLead[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [menuItems, setMenuItems] = useState<MenuItemInput[]>([
    { name: "", price: "" },
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visiblePlaces = useMemo(
    () => showAll ? places : places.filter((place) => !place.hasWebsite),
    [places, showAll],
  );
  const noWebsiteCount = places.filter((place) => !place.hasWebsite).length;

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searching || query.trim().length < 3) return;
    setSearching(true);
    setSearchError("");
    setHasSearched(true);
    try {
      const res = await fetch(`/api/outreach/search?q=${encodeURIComponent(query.trim())}&limit=20`);
      const data = await res.json().catch(() => ({ error: "Search request failed" }));
      if (!res.ok) {
        setPlaces([]);
        setSearchError((data as { error?: string }).error || "Restaurant search failed.");
        return;
      }
      setPlaces((data as { places: PlaceLead[] }).places);
    } catch {
      setPlaces([]);
      setSearchError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function selectPlace(place: PlaceLead) {
    setForm((prev) => ({
      ...prev,
      name: place.name,
      phone: place.phone,
      address: place.address,
      lat: place.lat ? String(place.lat) : "",
      lng: place.lng ? String(place.lng) : "",
      googlePlaceId: place.placeId,
      sourceUrl: place.googleMapsUrl,
      description: prev.description || `${place.name} is a restaurant located at ${place.address}.`,
    }));
    setError("");
    document.getElementById("restaurant-details")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function updateMenuItem(index: number, field: keyof MenuItemInput, value: string) {
    setMenuItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addMenuItem() {
    setMenuItems((prev) => [...prev, { name: "", price: "" }]);
  }

  function removeMenuItem(index: number) {
    setMenuItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    if (!form.name.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          lat: parseFloat(form.lat) || 0,
          lng: parseFloat(form.lng) || 0,
          imageUrls: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
          googlePlaceId: form.googlePlaceId || undefined,
          sourceUrl: form.sourceUrl,
          menuItems: menuItems
            .filter((item) => item.name.trim())
            .map((item) => ({
              name: item.name.trim(),
              price: parseFloat(item.price) || 0,
            })),
        }),
      });
      const data = await res.json().catch(() => ({ error: "Request failed" }));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to generate demo site.");
        return;
      }
      router.push(`/outreach/review?generated=${(data as { id: string }).id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Outreach</h2>
        <p className="text-sm text-gray-500 mt-1">
          Find restaurants without a website, review their details, and generate a demo.
        </p>
      </div>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-1">Find restaurant leads</h3>
        <p className="text-sm text-gray-500 mb-4">
          Use a specific query such as “Italian restaurants in Austin, Texas”.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Restaurant type and city"
            minLength={3}
            required
            className="flex-1 p-2.5 border rounded"
            disabled={searching}
          />
          <button
            type="submit"
            disabled={searching || query.trim().length < 3}
            className="px-5 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {searching ? "Searching…" : "Search Google Maps"}
          </button>
        </form>

        {searchError && (
          <p className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">{searchError}</p>
        )}

        {places.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-3">
              Search results provided by Google. Verify imported business details before outreach.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-sm text-gray-600">
                Found {places.length} restaurants; {noWebsiteCount} have no listed website.
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                />
                Show restaurants that already have a website
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {visiblePlaces.map((place) => (
                <article key={place.placeId} className="border rounded-lg p-4">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate">{place.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{place.address || "No address listed"}</p>
                    </div>
                    <span className={`h-fit text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      place.hasWebsite
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {place.hasWebsite ? "Has website" : "No website"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-3 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{place.phone || "No phone"}</span>
                    {place.rating !== null && (
                      <span>★ {place.rating} ({place.reviewCount})</span>
                    )}
                    {place.googleMapsUrl && (
                      <a
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="mt-4 text-sm px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    Use this restaurant
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        {hasSearched && !searching && !searchError && visiblePlaces.length === 0 && (
          <p className="mt-4 p-3 rounded bg-amber-50 text-amber-800 text-sm">
            No restaurants without a listed website were found. Enable “Show restaurants that
            already have a website” or try a more specific query.
          </p>
        )}
      </section>

      <form
        id="restaurant-details"
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-3xl scroll-mt-6"
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold">Restaurant details</h3>
            <p className="text-sm text-gray-500">Review and complete the information before generating.</p>
          </div>
          {form.googlePlaceId && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Clear selection
            </button>
          )}
        </div>

        {error && <p className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</p>}

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant name <span className="text-red-500">*</span>
          </label>
          <input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)}
            className="w-full p-2 border rounded" required disabled={isSubmitting} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Phone
            <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
              className="block w-full p-2 border rounded mt-1" disabled={isSubmitting} />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Outreach email
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
              className="block w-full p-2 border rounded mt-1" disabled={isSubmitting}
              placeholder="Add manually before sending" />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-4">
          Address
          <input value={form.address} onChange={(e) => updateField("address", e.target.value)}
            className="block w-full p-2 border rounded mt-1" disabled={isSubmitting} />
        </label>

        <label className="block text-sm font-medium text-gray-700 mb-4">
          Description
          <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)}
            className="block w-full p-2 border rounded mt-1" rows={3} disabled={isSubmitting} />
        </label>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Latitude
            <input type="number" step="any" value={form.lat} onChange={(e) => updateField("lat", e.target.value)}
              className="block w-full p-2 border rounded mt-1" disabled={isSubmitting} />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Longitude
            <input type="number" step="any" value={form.lng} onChange={(e) => updateField("lng", e.target.value)}
              className="block w-full p-2 border rounded mt-1" disabled={isSubmitting} />
          </label>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-6">
          Cover image URL
          <input type="url" value={form.imageUrl} onChange={(e) => updateField("imageUrl", e.target.value)}
            className="block w-full p-2 border rounded mt-1" disabled={isSubmitting}
            placeholder="Optional licensed image URL" />
        </label>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Menu items</span>
            <button type="button" onClick={addMenuItem} disabled={isSubmitting}
              className="text-sm text-blue-600 hover:text-blue-800">+ Add item</button>
          </div>
          {menuItems.map((item, index) => (
            <div key={index} className="flex gap-3 mb-2 items-start">
              <input value={item.name} onChange={(e) => updateMenuItem(index, "name", e.target.value)}
                className="flex-1 p-2 border rounded" disabled={isSubmitting} placeholder="Item name" />
              <input type="number" min="0" step="0.01" value={item.price}
                onChange={(e) => updateMenuItem(index, "price", e.target.value)}
                className="w-24 p-2 border rounded" disabled={isSubmitting} placeholder="Price" />
              {menuItems.length > 1 && (
                <button type="button" onClick={() => removeMenuItem(index)}
                  className="p-2 text-red-500" aria-label="Remove item">✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? "Generating…" : "Generate demo site"}
          </button>
        </div>
      </form>
    </div>
  );
}
