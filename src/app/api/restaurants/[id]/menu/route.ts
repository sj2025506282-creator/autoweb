import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDB();

  // Verify restaurant exists
  const restaurant = await db
    .prepare("SELECT id FROM restaurants WHERE id = ?")
    .bind(id)
    .first();
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const categories = await db
    .prepare(
      "SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order"
    )
    .bind(id)
    .all();

  const items = await db
    .prepare(
      `SELECT mi.* FROM menu_items mi
       JOIN menu_categories mc ON mi.category_id = mc.id
       WHERE mc.restaurant_id = ? ORDER BY mi.sort_order`
    )
    .bind(id)
    .all();

  return NextResponse.json({
    categories: categories.results,
    items: items.results,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const db = getDB();

  // Verify restaurant exists
  const restaurant = await db
    .prepare("SELECT id FROM restaurants WHERE id = ?")
    .bind(id)
    .first();
  if (!restaurant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.type === "category") {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    const categoryId = uuid();
    await db
      .prepare(
        "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)"
      )
      .bind(categoryId, id, body.name, body.sort_order || 0)
      .run();
    return NextResponse.json({ id: categoryId }, { status: 201 });
  }

  if (body.type === "item") {
    if (!body.category_id) {
      return NextResponse.json(
        { error: "category_id is required for items" },
        { status: 400 }
      );
    }
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      );
    }
    const itemId = uuid();
    await db
      .prepare(
        "INSERT INTO menu_items (id, category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(
        itemId,
        body.category_id,
        body.name,
        body.description || "",
        body.price || 0,
        body.sort_order || 0
      )
      .run();
    return NextResponse.json({ id: itemId }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const categoryId = searchParams.get("categoryId");
  const itemId = searchParams.get("itemId");
  const db = getDB();

  if (itemId) {
    await db.prepare("DELETE FROM menu_items WHERE id = ?").bind(itemId).run();
    return NextResponse.json({ success: true });
  }

  if (categoryId) {
    await db
      .prepare("DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?")
      .bind(categoryId, id)
      .run();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "categoryId or itemId query parameter is required" },
    { status: 400 }
  );
}
