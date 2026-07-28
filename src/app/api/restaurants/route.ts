import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM restaurants ORDER BY created_at DESC").all();
  return NextResponse.json(result.results);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, string>;
  const db = getDB();
  const id = uuid();
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  await db.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, opening_hours, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, slug, body.phone || "", body.email || "", body.address || "",
    body.lat || 0, body.lng || 0, JSON.stringify(body.opening_hours || {}),
    body.description || "", body.status || "draft").run();
  return NextResponse.json({ id, slug }, { status: 201 });
}
