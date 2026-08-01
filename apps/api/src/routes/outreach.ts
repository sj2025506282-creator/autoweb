import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { adminOnly, jwtAuth } from '../middleware/auth'
import { v4 as uuid } from 'uuid'
import { sendEmail, outreachEmailTemplate } from '../services/email'
import { PlacesSearchError, searchRestaurantLeads } from '../services/places'
import { checkRateLimit } from '../services/rate-limiter'

const app = new Hono<{
  Bindings: {
    DB: D1Database
    JWT_SECRET: string
    RESEND_API_KEY: string
    RESEND_FROM_EMAIL?: string
    PUBLIC_SITE_URL_TEMPLATE?: string
    GOOGLE_PLACES_API_KEY: string
  }
}>()

const searchSchema = z.object({
  q: z.string().trim().min(3).max(160),
  limit: z.coerce.number().int().min(1).max(20).default(20),
})

// GET /search?q=... — find restaurant leads through Google Places
app.get('/search', jwtAuth, adminOnly, zValidator('query', searchSchema), async (c) => {
  const { q, limit } = c.req.valid('query')
  const user = c.get('user')
  const rateLimit = checkRateLimit(`places:${user.id}`, 30, 60 * 60 * 1000)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Google Places search limit reached. Try again later.' }, 429)
  }
  try {
    const places = await searchRestaurantLeads(c.env.GOOGLE_PLACES_API_KEY, q, limit)
    return c.json({
      places,
      withoutWebsite: places.filter((place) => !place.hasWebsite).length,
    })
  } catch (error) {
    if (error instanceof PlacesSearchError) {
      return c.json({ error: error.message }, error.status as 400 | 502 | 503)
    }
    console.error('Unexpected Google Places search error', error)
    return c.json({ error: 'Restaurant search failed.' }, 502)
  }
})

// GET — return pending review demos
app.get('/', jwtAuth, adminOnly, async (c) => {
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
  googlePlaceId: z.string().max(255).optional(),
  sourceUrl: z.string().url().max(2048).optional().or(z.literal('')),
  menuItems: z.array(z.object({
    category: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().trim().min(8),
    price: z.number().optional(),
    imageUrl: z.string().url().or(z.literal('')).optional(),
  })).min(12),
}).superRefine((body, ctx) => {
  const categories = new Set(body.menuItems.map((item) => item.category.toLowerCase()))
  if (categories.size < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['menuItems'],
      message: 'A sales-ready demo requires at least 4 menu categories.',
    })
  }
})

// POST — generate demo restaurant site
app.post('/', jwtAuth, adminOnly, zValidator('json', createDemoSchema), async (c) => {
  const body = c.req.valid('json')

  const id = uuid()
  if (body.googlePlaceId) {
    const duplicate = await c.env.DB.prepare(
      'SELECT id, name, status FROM restaurants WHERE google_place_id = ?'
    ).bind(body.googlePlaceId).first()
    if (duplicate) {
      return c.json({
        error: 'A demo or restaurant already exists for this Google place.',
        existing: duplicate,
      }, 409)
    }
  }

  const slugBase = body.name.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '') || 'restaurant'
  let slug = slugBase
  let suffix = 2
  while (await c.env.DB.prepare('SELECT id FROM restaurants WHERE slug = ?').bind(slug).first()) {
    slug = `${slugBase}-${suffix++}`
  }

  const statements: D1PreparedStatement[] = [c.env.DB.prepare(
    `INSERT INTO restaurants (
       id, name, slug, phone, email, address, lat, lng, status, cover_image,
       description, google_place_id, source_url
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, ?, ?, ?)`
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
    body.description || '',
    body.googlePlaceId || '',
    body.sourceUrl || ''
  )]

  const categoryIds = new Map<string, string>()
  for (const item of body.menuItems) {
    if (!categoryIds.has(item.category)) {
      const catId = uuid()
      categoryIds.set(item.category, catId)
      statements.push(c.env.DB.prepare(
        'INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)'
      ).bind(catId, id, item.category, categoryIds.size - 1))
    }
  }
  for (let i = 0; i < body.menuItems.length; i++) {
    const item = body.menuItems[i]
    statements.push(c.env.DB.prepare(
      `INSERT INTO menu_items
       (id, category_id, name, description, price, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      uuid(), categoryIds.get(item.category), item.name, item.description,
      item.price || 0, item.imageUrl || '', i,
    ))
  }

  try {
    await c.env.DB.batch(statements)
  } catch (error) {
    if (
      body.googlePlaceId
      && error instanceof Error
      && error.message.includes('UNIQUE constraint failed: restaurants.google_place_id')
    ) {
      return c.json({ error: 'A demo or restaurant already exists for this Google place.' }, 409)
    }
    throw error
  }
  return c.json({ id, slug }, 201)
})

const updateStatusSchema = z.object({
  status: z.enum(['active', 'draft']).optional(),
  sendEmail: z.boolean().optional(),
})

// PUT /:id — approve or reject a demo restaurant
app.put('/:id', jwtAuth, adminOnly, zValidator('json', updateStatusSchema), async (c) => {
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

  let emailSent = false

  // Send before activation. A failed send leaves the demo reviewable and retryable.
  if (newStatus === 'active' && body.sendEmail === true) {
    const slug = restaurant.slug as string
    const name = restaurant.name as string
    const email = (restaurant.email as string) || ''

    if (!email) {
      return c.json({
        error: 'Add an outreach email address before approving and sending.',
      }, 422)
    }

    const claim = await c.env.DB.prepare(
      `UPDATE restaurants
       SET outreach_sent_at = 'pending', updated_at = datetime('now')
       WHERE id = ? AND status = 'demo' AND outreach_sent_at IS NULL`
    ).bind(id).run()
    if (claim.meta.changes !== 1) {
      return c.json({ error: 'This demo is already being reviewed.' }, 409)
    }

    try {
      const result = await sendEmail(c.env.RESEND_API_KEY, {
        from: c.env.RESEND_FROM_EMAIL || 'AutoWeb <noreply@autoweb.app>',
        to: email,
        subject: `Your restaurant website demo is ready — ${name}`,
        html: outreachEmailTemplate({
          restaurantName: name,
          demoUrl: (c.env.PUBLIC_SITE_URL_TEMPLATE || 'https://{slug}.autoweb.app')
            .replace('{slug}', encodeURIComponent(slug)),
        }),
      })
      if (result.error) {
        await c.env.DB.prepare(
          "UPDATE restaurants SET outreach_sent_at = NULL WHERE id = ? AND outreach_sent_at = 'pending'"
        ).bind(id).run()
        console.error('Resend rejected outreach email', result.error)
        return c.json({ error: 'Email provider rejected the outreach email. The demo was not activated.' }, 502)
      }
      emailSent = true
    } catch (error) {
      await c.env.DB.prepare(
        "UPDATE restaurants SET outreach_sent_at = NULL WHERE id = ? AND outreach_sent_at = 'pending'"
      ).bind(id).run()
      console.error('Failed to send outreach email for restaurant', id, error)
      return c.json({ error: 'Failed to send outreach email. The demo was not activated.' }, 502)
    }
  }

  const update = await c.env.DB.prepare(
    `UPDATE restaurants
     SET status = ?,
         outreach_sent_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
         updated_at = datetime('now')
     WHERE id = ? AND status = 'demo'
       AND (? = 0 OR outreach_sent_at = 'pending')`
  ).bind(newStatus, emailSent ? 1 : 0, id, emailSent ? 1 : 0).run()
  if (update.meta.changes !== 1) {
    return c.json({ error: 'This demo was already reviewed.' }, 409)
  }

  return c.json({ success: true, status: newStatus, emailSent })
})

export default app
