import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (user.role !== "admin" && user.restaurantId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");

  const db = getDB();
  let sql = "SELECT * FROM reservations WHERE restaurant_id = ?";
  const binds: unknown[] = [id];

  if (date) {
    sql += " AND date(reservation_time) = ?";
    binds.push(date);
  }

  sql += " ORDER BY reservation_time DESC";
  const result = await db.prepare(sql).bind(...binds).all();
  return NextResponse.json(result.results);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify the restaurant exists and is active
  const db = getDB();
  const restaurant = await db
    .prepare("SELECT id FROM restaurants WHERE id = ? AND status IN ('active','demo')")
    .bind(id)
    .first();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    customer_name?: string;
    phone?: string;
    email?: string;
    party_size?: number;
    reservation_time?: string;
    note?: string;
  };
  const { customer_name, phone, email, party_size, reservation_time, note } = body;

  // Validate required fields
  if (!customer_name || !phone || !reservation_time) {
    return NextResponse.json(
      { error: "Name, phone, and reservation time are required" },
      { status: 400 }
    );
  }

  const reservationId = uuidv4();

  await db
    .prepare(
      `INSERT INTO reservations (id, restaurant_id, customer_name, phone, email, party_size, reservation_time, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      reservationId,
      id,
      customer_name,
      phone || "",
      email || "",
      party_size || 2,
      reservation_time,
      note || ""
    )
    .run();

  return NextResponse.json(
    { id: reservationId, message: "Reservation created successfully" },
    { status: 201 }
  );
}
