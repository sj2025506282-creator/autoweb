import { Hono } from 'hono'
import { jwtAuth } from '../middleware/auth'
import { uploadImage, ImageUploadError } from '../services/image'

const app = new Hono<{ Bindings: { IMAGES: R2Bucket; JWT_SECRET: string } }>()

app.post('/upload', jwtAuth, async (c) => {
  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ error: 'Invalid multipart form data' }, 400)
  }

  const file = formData.get('file') as File | null
  const restaurantId = formData.get('restaurantId') as string | null

  if (!file || typeof file.name !== 'string' || file.size === 0) {
    return c.json({ error: 'A non-empty file is required' }, 400)
  }

  if (!restaurantId) {
    return c.json({ error: 'restaurantId is required' }, 400)
  }

  const user = c.get('user')
  if (user.role !== 'admin' && user.restaurantId !== restaurantId) {
    return c.json({ error: 'Restaurant access denied' }, 403)
  }

  try {
    const url = await uploadImage(c.env.IMAGES, file, restaurantId)
    return c.json({ url }, 201)
  } catch (err) {
    if (err instanceof ImageUploadError) {
      return c.json({ error: err.message }, err.status as 400 | 413)
    }
    console.error('Image upload failed:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
