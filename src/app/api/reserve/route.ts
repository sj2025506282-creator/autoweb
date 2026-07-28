import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { sendEmail, reservationEmailTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    restaurantId?: string;
    customerName?: string;
    phone?: string;
    email?: string;
    partySize?: number;
    reservationTime?: string;
    note?: string;
  };

  const { restaurantId, customerName, phone, email, partySize, reservationTime, note } = body;

  // Validate required fields
  if (!restaurantId || !customerName || !phone || !reservationTime) {
    return NextResponse.json(
      { error: "restaurantId, customerName, phone, and reservationTime are required" },
      { status: 400 }
    );
  }

  const db = getDB();

  const restaurant = await db
    .prepare("SELECT id, name, email FROM restaurants WHERE id = ?")
    .bind(restaurantId)
    .first<{ id: string; name: string; email: string }>();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const id = uuid();

  await db
    .prepare(
      `INSERT INTO reservations (id, restaurant_id, customer_name, phone, email, party_size, reservation_time, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      restaurantId,
      customerName,
      phone,
      email || "",
      partySize || 2,
      reservationTime,
      note || ""
    )
    .run();

  if (restaurant.email) {
    await sendEmail({
      to: restaurant.email,
      subject: `New Reservation — ${customerName}`,
      html: reservationEmailTemplate({
        restaurantName: restaurant.name,
        customerName,
        phone,
        email: email || "",
        partySize: partySize || 2,
        time: reservationTime,
        note: note || "",
      }),
    });
  }

  return NextResponse.json({ success: true, id }, { status: 201 });
}
