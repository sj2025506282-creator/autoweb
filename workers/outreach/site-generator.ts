export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

export interface DemoRestaurantData {
  name: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  menuItems: Array<{ name: string; price?: number }>;
  imageUrls: string[];
  description?: string;
}

// Creates a demo restaurant record in D1 with scraped/API data
export async function generateDemoSite(env: Env, data: DemoRestaurantData) {
  const id = crypto.randomUUID();
  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  await env.DB.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, status, cover_image, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?)`
  )
    .bind(
      id,
      data.name,
      slug,
      data.phone,
      data.email,
      data.address,
      data.lat,
      data.lng,
      data.imageUrls[0] || "",
      data.description || ""
    )
    .run();

  if (data.menuItems.length > 0) {
    const catId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, 'Menu', 0)"
    )
      .bind(catId, id)
      .run();
    for (let i = 0; i < data.menuItems.length; i++) {
      await env.DB.prepare(
        "INSERT INTO menu_items (id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(
          crypto.randomUUID(),
          catId,
          data.menuItems[i].name,
          data.menuItems[i].price || 0,
          i
        )
        .run();
    }
  }

  return { id, slug };
}
