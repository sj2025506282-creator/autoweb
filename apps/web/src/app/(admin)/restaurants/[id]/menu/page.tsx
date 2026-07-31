"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sort_order: number;
}

interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

export default function MenuPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const restaurantId = params.id;

  const [data, setData] = useState<MenuData>({ categories: [], items: [] });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    sort_order: 0,
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  // Item form state
  const [showItemFormForCategory, setShowItemFormForCategory] = useState<
    string | null
  >(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: 0,
    sort_order: 0,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Load failed" }));
        setError((err as { error?: string }).error ?? "Failed to load menu");
        return;
      }
      const result = (await res.json()) as MenuData;
      setData(result);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchMenu(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchMenu]);

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function getCategoryItems(categoryId: string): MenuItem[] {
    return data.items.filter((item) => item.category_id === categoryId);
  }

  // Category CRUD
  function openAddCategory() {
    setCategoryForm({ name: "", sort_order: 0 });
    setEditingCategoryId(null);
    setShowCategoryForm(true);
  }

  function openEditCategory(cat: MenuCategory) {
    setCategoryForm({
      name: cat.name,
      sort_order: cat.sort_order,
    });
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
  }

  function cancelCategoryForm() {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!categoryForm.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        // Update: delete old + create new (simplified — for full update, would need PUT)
        await fetch(
          `/api/restaurants/${restaurantId}/menu?categoryId=${editingCategoryId}`,
          { method: "DELETE" }
        );
      }
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          name: categoryForm.name,
          sort_order: categoryForm.sort_order,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        setError(
          (err as { error?: string }).error ?? "Failed to save category"
        );
        return;
      }
      setShowCategoryForm(false);
      setEditingCategoryId(null);
      await fetchMenu();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteCategory(categoryId: string) {
    if (
      !confirm(
        "Delete this category and all its items? This cannot be undone."
      )
    )
      return;
    setError("");
    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu?categoryId=${categoryId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        setError(
          (err as { error?: string }).error ?? "Failed to delete category"
        );
        return;
      }
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        next.delete(categoryId);
        return next;
      });
      await fetchMenu();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  // Item CRUD
  function openAddItem(categoryId: string) {
    setItemForm({ name: "", description: "", price: 0, sort_order: 0 });
    setEditingItemId(null);
    setShowItemFormForCategory(categoryId);
    // Ensure category is expanded
    setExpandedCategories((prev) => new Set(prev).add(categoryId));
  }

  function openEditItem(item: MenuItem) {
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      sort_order: item.sort_order,
    });
    setEditingItemId(item.id);
    setShowItemFormForCategory(item.category_id);
  }

  function cancelItemForm() {
    setShowItemFormForCategory(null);
    setEditingItemId(null);
  }

  async function submitItem(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!itemForm.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!showItemFormForCategory) {
      setError("No category selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItemId) {
        await fetch(
          `/api/restaurants/${restaurantId}/menu?itemId=${editingItemId}`,
          { method: "DELETE" }
        );
      }
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "item",
          category_id: showItemFormForCategory,
          name: itemForm.name,
          description: itemForm.description,
          price: itemForm.price,
          sort_order: itemForm.sort_order,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        setError(
          (err as { error?: string }).error ?? "Failed to save item"
        );
        return;
      }
      setShowItemFormForCategory(null);
      setEditingItemId(null);
      await fetchMenu();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    setError("");
    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu?itemId=${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Delete failed" }));
        setError(
          (err as { error?: string }).error ?? "Failed to delete item"
        );
        return;
      }
      await fetchMenu();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading menu…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Menu Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage categories and menu items for this restaurant.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            Back to Restaurant
          </button>
          <button
            onClick={openAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
          <button
            className="ml-3 underline"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Form Modal/Panel */}
      {showCategoryForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-xl">
          <h3 className="text-lg font-semibold mb-4">
            {editingCategoryId ? "Edit Category" : "New Category"}
          </h3>
          <form onSubmit={submitCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded disabled:bg-gray-50"
                required
                disabled={isSubmitting}
                placeholder="e.g. Appetizers, Main Courses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    sort_order: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full p-2 border rounded disabled:bg-gray-50"
                disabled={isSubmitting}
                placeholder="0"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelCategoryForm}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isSubmitting
                  ? "Saving…"
                  : editingCategoryId
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {data.categories.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-500 mb-4">
            No menu categories yet. Create your first category to get started.
          </p>
          <button
            onClick={openAddCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const items = getCategoryItems(category.id);
            const isAddingItem = showItemFormForCategory === category.id;

            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-6 py-4">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="font-semibold text-gray-900 truncate">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-400 ml-2">
                      ({items.length} items)
                    </span>
                  </button>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openAddItem(category.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                    >
                      + Item
                    </button>
                    <button
                      onClick={() => openEditCategory(category)}
                      className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Content: Items List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    {items.length === 0 && !isAddingItem && (
                      <p className="text-sm text-gray-400 py-2">
                        No items in this category yet.
                      </p>
                    )}

                    {/* Items table */}
                    {items.length > 0 && (
                      <div className="mb-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="pb-2 font-medium">Name</th>
                              <th className="pb-2 font-medium">Description</th>
                              <th className="pb-2 font-medium text-right">
                                Price
                              </th>
                              <th className="pb-2 font-medium text-right">
                                Sort
                              </th>
                              <th className="pb-2 font-medium text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id} className="border-b last:border-0">
                                <td className="py-2 text-gray-900">
                                  {item.name}
                                </td>
                                <td className="py-2 text-gray-500 max-w-xs truncate">
                                  {item.description || "—"}
                                </td>
                                <td className="py-2 text-right text-gray-900">
                                  ${item.price.toFixed(2)}
                                </td>
                                <td className="py-2 text-right text-gray-500">
                                  {item.sort_order}
                                </td>
                                <td className="py-2 text-right">
                                  <button
                                    onClick={() => openEditItem(item)}
                                    className="text-blue-600 hover:text-blue-800 mr-2"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Item Form (shown under expanded category) */}
                    {isAddingItem && (
                      <div className="bg-white p-4 rounded border max-w-xl">
                        <h4 className="text-sm font-semibold mb-3">
                          {editingItemId ? "Edit Item" : "New Item"}
                        </h4>
                        <form onSubmit={submitItem} className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={itemForm.name}
                              onChange={(e) =>
                                setItemForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full p-2 border rounded text-sm disabled:bg-gray-50"
                              required
                              disabled={isSubmitting}
                              placeholder="Item name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={itemForm.description}
                              onChange={(e) =>
                                setItemForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full p-2 border rounded text-sm disabled:bg-gray-50"
                              disabled={isSubmitting}
                              placeholder="Short description"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemForm.price}
                                onChange={(e) =>
                                  setItemForm((prev) => ({
                                    ...prev,
                                    price: parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="w-full p-2 border rounded text-sm disabled:bg-gray-50"
                                disabled={isSubmitting}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Sort Order
                              </label>
                              <input
                                type="number"
                                value={itemForm.sort_order}
                                onChange={(e) =>
                                  setItemForm((prev) => ({
                                    ...prev,
                                    sort_order: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="w-full p-2 border rounded text-sm disabled:bg-gray-50"
                                disabled={isSubmitting}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={cancelItemForm}
                              className="px-3 py-1.5 text-sm border rounded text-gray-700 hover:bg-gray-50"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            >
                              {isSubmitting
                                ? "Saving…"
                                : editingItemId
                                  ? "Update Item"
                                  : "Add Item"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
