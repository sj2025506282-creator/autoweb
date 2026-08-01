// Core entities (from current src/types/index.ts)

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
  menu_source_url?: string;
  menu_verified?: number;
  outreach_sent_at?: string | null;
  template_id: string;
  domain_custom: string;
  status: 'draft' | 'active' | 'demo';
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

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  config: string;
}

// Session user

export interface SessionUser {
  id: string;
  email: string;
  role: 'admin' | 'owner';
  restaurantId?: string;
}

// API types

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  role: string;
  user: SessionUser;
}

export interface AnalyticsStats {
  pv: number;
  uv: number;
  byDay: { day: string; views: number }[];
  topPages: { page: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
}
