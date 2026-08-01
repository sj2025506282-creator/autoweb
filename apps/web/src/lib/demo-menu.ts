import type { MenuItem, Restaurant } from "@autoweb/shared";

export type SiteMenuItem = MenuItem & { category_name: string };

const lisbonMenu = [
  ["Petiscos", "Pastéis de Bacalhau", "Crisp salt cod fritters, parsley and lemon aioli", 8, "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=85"],
  ["Petiscos", "Polvo à Lagareiro", "Charred octopus, crushed potatoes, garlic and olive oil", 16, "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=85"],
  ["Da Terra", "Arroz de Pato", "Slow-cooked duck rice, chouriço and a golden oven crust", 19, "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=85"],
  ["Da Terra", "Bochechas de Porco", "Braised pork cheeks, silky potato purée and red wine jus", 22, "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85"],
  ["Do Mar", "Bacalhau à Brás", "Salt cod, shoestring potatoes, soft egg and black olives", 18, "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=85"],
  ["Do Mar", "Robalo Grelhado", "Grilled sea bass, seasonal greens and lemon butter", 24, "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=85"],
  ["Sobremesas", "Pastel de Nata", "Warm custard tart with cinnamon and orange zest", 5, "https://images.unsplash.com/photo-1621341258668-b2bf005a9f97?auto=format&fit=crop&w=800&q=85"],
  ["Sobremesas", "Mousse de Chocolate", "Dark chocolate, sea salt and extra virgin olive oil", 7, "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=85"],
] as const;

const universalMenu = [
  ["To Begin", "Market Croquettes", "Golden, crisp and served with a bright herb aioli", 9, "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=85"],
  ["To Begin", "Seasonal Burrata", "Market fruit, toasted seeds and house vinaigrette", 14, "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=800&q=85"],
  ["From the Kitchen", "Chef's Signature", "A seasonal expression of the kitchen's favourite ingredients", 24, "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=85"],
  ["From the Kitchen", "Slow-Roasted Chicken", "Crisp potatoes, garden herbs and natural jus", 21, "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=85"],
  ["From the Sea", "Catch of the Day", "Open-fire fish, seasonal greens and citrus butter", 26, "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=85"],
  ["Dessert", "Dark Chocolate Crémeux", "Sea salt, olive oil and toasted hazelnut", 9, "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=85"],
] as const;

export function getDemoMenu(restaurant: Restaurant): SiteMenuItem[] {
  const location = `${restaurant.address} ${restaurant.description}`.toLowerCase();
  const source = /lisbon|lisboa|portugal/.test(location) ? lisbonMenu : universalMenu;

  return source.map(([category, name, description, price, image], index) => ({
    id: `demo-${index}`,
    category_id: `demo-${category}`,
    category_name: category,
    name,
    description,
    price,
    image_url: image,
    sort_order: index,
  }));
}

export function menuCurrency(restaurant: Restaurant): string {
  return /lisbon|lisboa|portugal|europe/i.test(restaurant.address) ? "€" : "$";
}
