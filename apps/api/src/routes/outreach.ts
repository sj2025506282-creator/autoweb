import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { jwtAuth } from '../middleware/auth'
import { v4 as uuid } from 'uuid'
import { sendEmail, outreachEmailTemplate } from '../services/email'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string; RESEND_API_KEY: string } }>()

// GET — return pending review demos
app.get('/', jwtAuth, async (c) => {
  const demos = await c.env.DB.prepare(
    "SELECT * FROM restaurants WHERE status = 'demo' ORDER BY created_at DESC"
  ).all()
  return c.json(demos.results)
})

const createDemoSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
  description: z.string().optional(),
  menuItems: z.array(z.object({
    name: z.string(),
    price: z.number().optional(),
  })).optional(),
})

// POST — generate demo restaurant site
app.post('/', jwtAuth, zValidator('json', createDemoSchema), async (c) => {
  const body = c.req.valid('json')

  const id = uuid()
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  await c.env.DB.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, status, cover_image, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?)`
  ).bind(
    id,
    body.name,
    slug,
    body.phone || '',
    body.email || '',
    body.address || '',
    body.lat || 0,
    body.lng || 0,
    body.imageUrls?.[0] || '',
    body.description || ''
  ).run()

  if (body.menuItems && body.menuItems.length > 0) {
    const catId = uuid()
    await c.env.DB.prepare(
      "INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, 'Menu', 0)"
    ).bind(catId, id).run()
    for (let i = 0; i < body.menuItems.length; i++) {
      await c.env.DB.prepare(
        'INSERT INTO menu_items (id, category_id, name, price, sort_order) VALUES (?, ?, ?, ?, ?)'
      ).bind(uuid(), catId, body.menuItems[i].name, body.menuItems[i].price || 0, i).run()
    }
  }

  return c.json({ id, slug }, 201)
})

const updateStatusSchema = z.object({
  status: z.enum(['active', 'draft']).optional(),
  sendEmail: z.boolean().optional(),
})

// PUT /:id — approve or reject a demo restaurant
app.put('/:id', jwtAuth, zValidator('json', updateStatusSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const newStatus = body.status || 'active'

  // Verify the restaurant exists and is currently a demo
  const existing = await c.env.DB.prepare(
    "SELECT * FROM restaurants WHERE id = ? AND status = 'demo'"
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Demo restaurant not found' }, 404)
  }

  const restaurant = existing as Record<string, unknown>

  await c.env.DB.prepare(
    "UPDATE restaurants SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(newStatus, id).run()

  // Send outreach email if approving to active
  if (newStatus === 'active' && body.sendEmail !== false) {
    const slug = restaurant.slug as string
    const name = restaurant.name as string
    const email = (restaurant.email as string) || ''

    if (email) {
      try {
        await sendEmail(c.env.RESEND_API_KEY, {
          to: email,
          subject: `Your restaurant website demo is ready — ${name}`,
          html: outreachEmailTemplate({ restaurantName: name, demoUrl: slug }),
        })
      } catch {
        // Email failure is non-blocking
        console.error('Failed to send outreach email for restaurant', id)
      }
    }
  }

  return c.json({ success: true, status: newStatus })
})

export default app
