import type { Restaurant } from "@autoweb/shared";

export interface VerifiedProfile {
  sourceUrl: string;
  about: string;
  facts: string[];
  hours: string;
  bookingNote: string;
}

export function getVerifiedProfile(restaurant: Restaurant): VerifiedProfile | null {
  if (!/r\. da atalaia 31|rua da atalaia no 31/i.test(restaurant.address)) return null;

  return {
    sourceUrl: "https://www.tripadvisor.co.uk/Restaurant_Review-g189158-d15087513-Reviews-A_Nossa_Casa-Lisbon_Lisbon_District_Central_Portugal.html",
    about: "A small family business in Lisbon's historic Bairro Alto, serving dishes designed for sharing with seasonal Portuguese ingredients.",
    facts: ["Portuguese cuisine", "Vegetarian, vegan and gluten-free options", "Family style", "Full bar"],
    hours: "Daily · 18:30–22:30",
    bookingNote: "The restaurant recommends booking two to three days in advance.",
  };
}
