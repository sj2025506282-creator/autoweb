export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  opening_hours: string;
  cover_image: string;
  description: string;
  google_place_id?: string;
  source_url?: string;
  outreach_sent_at?: string | null;
  template_id: string;
  domain_custom: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sort_order: number;
  category_name?: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  phone: string;
  email: string;
  party_size: number;
  reservation_time: string;
  note: string;
  created_at: string;
}
