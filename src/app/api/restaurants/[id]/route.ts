import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE id = ?").bind(id).first();
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(restaurant);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, string>;
  const db = getDB();
  await db.prepare(
    `UPDATE restaurants SET name=?, phone=?, email=?, address=?, lat=?, lng=?,
     opening_hours=?, description=?, template_id=?, status=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(body.name, body.phone || "", body.email || "", body.address || "",
    body.lat || 0, body.lng || 0, JSON.stringify(body.opening_hours || {}),
    body.description || "", body.template_id || "template-1", body.status || "draft", id).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDB();
  await db.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();
  return NextResponse.json({ success: true });
}
