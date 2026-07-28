import { NextRequest, NextResponse } from "next/server";
import { uploadImage, ImageUploadError } from "@/lib/image";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  const restaurantId = formData.get("restaurantId") as string | null;

  if (!file || typeof file.name !== "string" || file.size === 0) {
    return NextResponse.json(
      { error: "A non-empty file is required" },
      { status: 400 },
    );
  }

  if (!restaurantId) {
    return NextResponse.json(
      { error: "restaurantId is required" },
      { status: 400 },
    );
  }

  try {
    const url = await uploadImage(file, restaurantId);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    if (err instanceof ImageUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Image upload failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
