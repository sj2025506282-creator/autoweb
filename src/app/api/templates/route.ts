import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
  const db = getDB();
  const result = await db.prepare("SELECT * FROM templates ORDER BY name ASC").all();
  return NextResponse.json(result.results);
}
