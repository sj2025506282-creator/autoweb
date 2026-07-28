import { queryFirst } from "@/lib/db";
import { notFound } from "next/navigation";
import { RestaurantForm } from "../restaurant-form";

interface Restaurant {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  status: string;
  template_id: string;
}

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await queryFirst<Restaurant>(
    "SELECT * FROM restaurants WHERE id = ?",
    [id]
  );

  if (!restaurant) {
    notFound();
  }

  return <RestaurantForm mode="edit" initialData={restaurant} />;
}
