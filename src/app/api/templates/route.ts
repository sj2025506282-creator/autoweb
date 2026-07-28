import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const result = await db.prepare("SELECT * FROM templates ORDER BY name ASC").all();
  return NextResponse.json(result.results);
}
