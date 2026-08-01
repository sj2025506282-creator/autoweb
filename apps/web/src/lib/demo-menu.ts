import type { MenuItem, Restaurant } from "@autoweb/shared";

export type SiteMenuItem = MenuItem & { category_name: string };

const verifiedNossaCasaMenu = [
  ["To Start", "Oyster", "Ginger gel, tabasco and coriander", 3.5, ""],
  ["To Start", "Cockles", "Coconut milk, chouriço, lemongrass and galangal", 13.5, ""],
  ["To Start", "Tuna Tartar", "Fried wonton, olives, tomato confit and chilli oil mayo", 15.5, ""],
  ["To Start", "Angus Tartare", "Beef tartare, chilli oil, cured egg yolk, blueberries and grilled sourdough", 13.5, ""],
  ["To Start", "Cottage Cheese, Grapes", "Seasoned cottage cheese, pomegranate, flamed plums, grapes and curry seeds", 9.5, ""],
  ["To Start", "Pumpkin & Sweet Potato Gnocchi", "Grilled pumpkin, kefir buttermilk, mole verde and sweet potato chips", 10.5, ""],
] as const;

export const NOSSA_CASA_MENU_SOURCE = "https://www.tripadvisor.co.uk/Restaurant_Review-g189158-d15087513-Reviews-A_Nossa_Casa-Lisbon_Lisbon_District_Central_Portugal.html";

export function getDemoMenu(restaurant: Restaurant): SiteMenuItem[] {
  return getDemoMenuForLocation(`${restaurant.address} ${restaurant.description}`);
}

export function getDemoMenuForLocation(locationInput: string): SiteMenuItem[] {
  const location = locationInput.toLowerCase();
  const source = /r\. da atalaia 31|a nossa casa/.test(location) ? verifiedNossaCasaMenu : [];

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
