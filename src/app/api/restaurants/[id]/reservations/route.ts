import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
