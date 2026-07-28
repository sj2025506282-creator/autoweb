import { NextRequest, NextResponse } from "next/server";
import { trackPageView } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    restaurantId?: string;
    page?: string;
    referrer?: string;
  };
  const { restaurantId, page, referrer } = body;
  if (!restaurantId || !page) {
    return NextResponse.json(
      { error: "restaurantId and page required" },
      { status: 400 }
    );
  }
  await trackPageView(restaurantId, page, referrer || "");
  return NextResponse.json({ success: true });
}
