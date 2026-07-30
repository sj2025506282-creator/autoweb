"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface MenuItemInput {
  name: string;
  price: string;
}

export default function OutreachPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    lat: "",
    lng: "",
    imageUrl: "",
  });
  const [menuItems, setMenuItems] = useState<MenuItemInput[]>([
    { name: "", price: "" },
  ]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        lat: parseFloat(form.lat) || 0,
        lng: parseFloat(form.lng) || 0,
        imageUrls: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
        menuItems: menuItems
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name.trim(),
            price: parseFloat(m.price) || 0,
          })),
      };

      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as { id: string; slug: string };
        router.push(`/outreach/review?generated=${data.id}`);
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError((data as { error?: string }).error ?? "Failed to generate demo site");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Outreach</h2>
          <p className="text-sm text-gray-500 mt-1">
            Search for restaurants and generate demo sites to send for outreach.
          </p>
        </div>
      </div>

      {/* Google Maps Search Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-2">Search Restaurants</h3>
        <p className="text-sm text-gray-500 mb-3">
          Google Maps integration coming soon. For now, manually enter restaurant details below.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by name or location..."
            className="flex-1 p-2 border rounded bg-gray-50 text-gray-400"
            disabled
          />
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
            disabled
          >
            Search
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-3xl">
        <h3 className="text-lg font-semibold mb-4">Restaurant Details</h3>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            required
            disabled={isSubmitting}
            placeholder="e.g. Joe's Italian Bistro"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
              placeholder="restaurant@example.com"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            disabled={isSubmitting}
            placeholder="123 Main St, City, State"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            rows={3}
            disabled={isSubmitting}
            placeholder="A short description of the restaurant"
          />
        </div>

        {/* Lat & Lng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => updateField("lat", e.target.value)}
              className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
              placeholder="40.7128"
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => updateField("lng", e.target.value)}
              className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
              placeholder="-74.0060"
            />
          </div>
        </div>

        {/* Cover Image URL */}
        <div className="mb-6">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image URL
          </label>
          <input
            id="imageUrl"
            type="url"
            value={form.imageUrl}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            disabled={isSubmitting}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Menu Items */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Menu Items</label>
            <button
              type="button"
              onClick={addMenuItem}
              disabled={isSubmitting}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
            >
              + Add Item
            </button>
          </div>
          {menuItems.map((item, i) => (
            <div key={i} className="flex gap-3 mb-2 items-start">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateMenuItem(i, "name", e.target.value)}
                className="flex-1 p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
                disabled={isSubmitting}
                placeholder="Item name"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={(e) => updateMenuItem(i, "price", e.target.value)}
                className="w-24 p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
                disabled={isSubmitting}
                placeholder="Price"
              />
              {menuItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMenuItem(i)}
                  disabled={isSubmitting}
                  className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-300"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Generating…" : "Generate Demo Site"}
          </button>
        </div>
      </form>
    </div>
  );
}
