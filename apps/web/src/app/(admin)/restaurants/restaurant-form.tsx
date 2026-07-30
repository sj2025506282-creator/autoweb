"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
}

interface RestaurantFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  status: string;
  template_id: string;
}

interface RestaurantFormProps {
  initialData?: RestaurantFormData & { id: string };
  mode: "create" | "edit";
}

export function RestaurantForm({ initialData, mode }: RestaurantFormProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState<RestaurantFormData>({
    name: initialData?.name ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "draft",
    template_id: initialData?.template_id ?? "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        const templates = data as Template[];
        setTemplates(templates);
        if (!initialData?.template_id && templates.length > 0) {
          setForm((prev) => ({ ...prev, template_id: templates[0].id }));
        }
      })
      .catch(() => setError("Failed to load templates"));
  }, [initialData?.template_id]);

  function updateField(field: keyof RestaurantFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      const url =
        mode === "create"
          ? "/api/restaurants"
          : `/api/restaurants/${initialData!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/restaurants");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError((data as { error?: string }).error ?? "Failed to save restaurant");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;
    if (isDeleting) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/restaurants/${initialData!.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/restaurants");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: "Delete failed" }));
        setError((data as { error?: string }).error ?? "Failed to delete restaurant");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        {mode === "create" ? "New Restaurant" : "Edit Restaurant"}
      </h1>

      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {/* Name */}
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
          required
          disabled={isSubmitting}
          placeholder="Restaurant name"
        />
      </div>

      {/* Phone & Email (side by side) */}
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

      {/* Status & Template (side by side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            disabled={isSubmitting}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="demo">Demo</option>
          </select>
        </div>
        <div>
          <label htmlFor="template_id" className="block text-sm font-medium text-gray-700 mb-1">
            Template
          </label>
          <select
            id="template_id"
            value={form.template_id}
            onChange={(e) => updateField("template_id", e.target.value)}
            className="w-full p-2 border rounded disabled:bg-gray-50 disabled:text-gray-400"
            disabled={isSubmitting}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
        <div className="flex gap-3">
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving…" : mode === "create" ? "Create" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
