import { apiFetch } from "@/lib/api-client";
import { notFound } from "next/navigation";
import { RestaurantForm } from "../restaurant-form";
import type { Restaurant } from "@autoweb/shared";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let restaurant: Restaurant | null = null;
  try {
    restaurant = await apiFetch<Restaurant>('/api/restaurants/' + id);
  } catch {
    // will 404 below
  }

  if (!restaurant) {
    notFound();
  }

  return <RestaurantForm mode="edit" initialData={restaurant} />;
}
