import { v4 as uuid } from 'uuid'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message)
    this.name = 'ImageUploadError'
  }
}

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError(
      `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    )
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new ImageUploadError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
    )
  }
}

export async function uploadImage(
  bucket: R2Bucket,
  file: File,
  restaurantId: string,
): Promise<string> {
  validateFile(file)

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const key = `restaurants/${restaurantId}/${uuid()}.${ext}`
  const buffer = await file.arrayBuffer()

  await bucket.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  })

  // Return the key; the public URL can be constructed from the R2 public URL binding if configured
  return key
}

export async function deleteImage(bucket: R2Bucket, url: string): Promise<void> {
  // Extract key from URL or use as-is if it's already a key
  const key = url.includes('://')
    ? url.split('/').slice(-2).join('/')
    : url
  await bucket.delete(key)
}
