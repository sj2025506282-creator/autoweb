import type { MenuItem, Restaurant } from "@autoweb/shared";

export type SiteMenuItem = MenuItem & { category_name: string };

const verifiedNossaCasaMenu = [
  ["To Start", "Oyster", "Ginger gel, tabasco and coriander", 3.5, ""],
  ["To Start", "Cockles", "Coconut milk, chouriço, lemongrass and galangal", 13.5, ""],
  ["To Start", "Tuna Tartar", "Fried wonton, olives, tomato confit and chilli oil mayo", 15.5, ""],
  ["To Start", "Angus Tartare", "Beef tartare, chilli oil, cured egg yolk, blueberries and grilled sourdough", 13.5, ""],
  ["To Start", "Cottage Cheese, Grapes", "Seasoned cottage cheese, pomegranate, flamed plums, grapes and curry seeds", 9.5, ""],
  ["Pasta & Vegetables", "Pumpkin & Sweet Potato Gnocchi", "Grilled pumpkin, kefir buttermilk, mole verde and sweet potato chips", 10.5, ""],
  ["From the Sea", "Cured Fish of the Day", "", 0, ""],
  ["From the Sea", "Scallops", "", 0, ""],
  ["From the Sea", "Seafood Curry", "", 0, ""],
  ["From the Sea", "Clams Rice", "", 0, ""],
  ["From the Land", "Beef Tartare", "", 0, ""],
  ["From the Land", "Galta de Ternera", "", 0, ""],
  ["From the Land", "Pork Cheek Tacos", "", 0, ""],
  ["From the Land", "Beef Cheek Croquete", "", 0, ""],
  ["From the Land", "Pork Ribs", "", 0, ""],
] as const;

export const NOSSA_CASA_MENU_SOURCE = "https://www.google.com/maps/place/A+Nossa+Casa/@38.7118452,-9.1449444,17z/data=!4m7!3m6!1s0xd19353946e25371:0xc085f0ed901c4ee0!8m2!3d38.7118452!4d-9.1449444!10e9!16s%2Fg%2F11f9z8g95f";
const NOSSA_CASA_MENU_SPRITE = "/images/a-nossa-casa-menu-sprite-v1.webp";

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
    image_url: image || `${NOSSA_CASA_MENU_SPRITE}#tile-${index}`,
    sort_order: index,
  }));
}

export function menuCurrency(restaurant: Restaurant): string {
  return /lisbon|lisboa|portugal|europe/i.test(restaurant.address) ? "€" : "$";
}
