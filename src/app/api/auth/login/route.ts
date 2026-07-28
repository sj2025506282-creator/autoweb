import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { queryFirst } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await queryFirst<{ id: string; email: string; password_hash: string; role: string; restaurant_id: string | null }>(
    "SELECT * FROM users WHERE email = ?", [email]
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "owner",
    restaurantId: user.restaurant_id ?? undefined,
  });
  return NextResponse.json({ success: true, role: user.role });
}
