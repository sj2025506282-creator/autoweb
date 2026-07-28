import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDB();
  const restaurant = await db.prepare("SELECT * FROM restaurants WHERE id = ?").bind(id).first();
  if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(restaurant);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as Record<string, string>;
  const db = getDB();

  const existing = await db.prepare("SELECT * FROM restaurants WHERE id = ?").bind(id).first() as Record<string, unknown> | null;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const name = body.name ?? existing.name as string;
  const phone = body.phone ?? (existing.phone as string) ?? "";
  const email = body.email ?? (existing.email as string) ?? "";
  const address = body.address ?? (existing.address as string) ?? "";
  const lat = "lat" in body ? body.lat : (existing.lat ?? 0);
  const lng = "lng" in body ? body.lng : (existing.lng ?? 0);
  const opening_hours = "opening_hours" in body ? JSON.stringify(body.opening_hours) : (existing.opening_hours ?? "{}");
  const description = body.description ?? (existing.description as string) ?? "";
  const template_id = body.template_id ?? (existing.template_id as string) ?? "template-1";
  const status = body.status ?? (existing.status as string) ?? "draft";

  await db.prepare(
    `UPDATE restaurants SET name=?, phone=?, email=?, address=?, lat=?, lng=?,
     opening_hours=?, description=?, template_id=?, status=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(name, phone, email, address, lat, lng, opening_hours,
    description, template_id, status, id).run();
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDB();
  await db.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();
  return NextResponse.json({ success: true });
}
