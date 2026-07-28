import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { queryFirst } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";

const VALID_ROLES = new Set(["admin", "owner"]);

export async function POST(request: NextRequest) {
  // Rate limiting: 5 attempts per IP per 15 minutes
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  const { email, password } = await request.json() as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }
  const user = await queryFirst<{
    id: string;
    email: string;
    password_hash: string;
    role: string;
    restaurant_id: string | null;
  }>("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Validate role from database before casting
  if (!VALID_ROLES.has(user.role)) {
    return NextResponse.json(
      { error: "Invalid user role" },
      { status: 500 }
    );
  }

  await createSession({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "owner",
    restaurantId: user.restaurant_id ?? undefined,
  });
  return NextResponse.json({ success: true, role: user.role });
}
