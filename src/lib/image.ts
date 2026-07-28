import { getRequestContext } from "@cloudflare/next-on-pages";
import { v4 as uuid } from "uuid";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`,
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ImageUploadError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
    );
  }
}

export async function uploadImage(
  file: File,
  restaurantId: string,
): Promise<string> {
  validateFile(file);

  const { env } = getRequestContext();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const key = `restaurants/${restaurantId}/${uuid()}.${ext}`;
  const buffer = await file.arrayBuffer();

  await env.IMAGES.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = process.env.R2_PUBLIC_URL || "";
  return publicUrl ? `${publicUrl}/${key}` : key;
}

export async function deleteImage(url: string): Promise<void> {
  const { env } = getRequestContext();
  // Extract key from URL or use as-is if it's already a key
  const key = url.includes("://")
    ? url.split("/").slice(-2).join("/")
    : url;
  await env.IMAGES.delete(key);
}

/** AI image enhancement placeholder — not yet implemented */
export interface ImageEnhancementRequest {
  originalUrl: string;
  restaurantId: string;
}

export async function requestEnhancement(
  _req: ImageEnhancementRequest,
): Promise<{ taskId: string }> {
  throw new Error("AI image enhancement not yet implemented");
}
