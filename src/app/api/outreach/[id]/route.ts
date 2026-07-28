import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { outreachEmailTemplate } from "@/lib/outreach";

// PUT — Approve or reject a demo restaurant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as { status?: string; sendEmail?: boolean };

  const newStatus = body.status || "active";

  if (newStatus !== "active" && newStatus !== "draft") {
    return NextResponse.json(
      { error: "Status must be 'active' or 'draft'" },
      { status: 400 }
    );
  }

  const db = getDB();

  // Verify the restaurant exists and is currently a demo
  const existing = await db
    .prepare("SELECT * FROM restaurants WHERE id = ? AND status = 'demo'")
    .bind(id)
    .first();

  if (!existing) {
    return NextResponse.json(
      { error: "Demo restaurant not found" },
      { status: 404 }
    );
  }

  const restaurant = existing as Record<string, unknown>;

  await db
    .prepare("UPDATE restaurants SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newStatus, id)
    .run();

  // Send outreach email if approving to active
  if (newStatus === "active" && body.sendEmail !== false) {
    const slug = restaurant.slug as string;
    const name = restaurant.name as string;
    const email = (restaurant.email as string) || "";

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Your restaurant website demo is ready — ${name}`,
          html: outreachEmailTemplate({ restaurantName: name, demoUrl: slug }),
        });
      } catch {
        // Email failure is non-blocking
        console.error("Failed to send outreach email for restaurant", id);
      }
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
