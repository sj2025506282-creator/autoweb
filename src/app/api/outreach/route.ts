import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

// GET — Return pending review demos
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const demos = await db
    .prepare("SELECT * FROM restaurants WHERE status = 'demo' ORDER BY created_at DESC")
    .all();
  return NextResponse.json(demos.results);
}

// POST — Generate demo restaurant site
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDB();
  const id = uuid();
  const slug = (body.name as string)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  await db
    .prepare(
      `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, status, cover_image, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?)`
    )
    .bind(
      id,
      body.name as string,
      slug,
      (body.phone as string) || "",
      (body.email as string) || "",
      (body.address as string) || "",
      (body.lat as number) || 0,
      (body.lng as number) || 0,
      (body.imageUrls as string[])?.[0] || "",
      (body.description as string) || ""
    )
    .run();

  const menuItems = body.menuItems as Array<{ name: string; price?: number }> | undefined;
  if (menuItems && menuItems.length > 0) {
    const catId = uuid();
    await db
      .prepare(
        "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, 'Menu', 0)"
      )
      .bind(catId, id)
      .run();
    for (let i = 0; i < menuItems.length; i++) {
      await db
        .prepare(
          "INSERT INTO menu_items (id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(uuid(), catId, menuItems[i].name, menuItems[i].price || 0, i)
        .run();
    }
  }

  return NextResponse.json({ id, slug }, { status: 201 });
}
