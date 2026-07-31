import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { jwtAuth, restaurantAccess } from '../middleware/auth'
import { trackPageView, getAnalyticsStats } from '../services/analytics'
import { checkRateLimit } from '../services/rate-limiter'
import { v4 as uuid } from 'uuid'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

const trackSchema = z.object({
  restaurantId: z.string().min(1),
  page: z.string().min(1),
  referrer: z.string().optional(),
  visitorId: z.string().optional(),
})

// POST /track — track a page view event
app.post('/track', zValidator('json', trackSchema), async (c) => {
  const body = c.req.valid('json')

  const ip = c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  // Rate limit: 100 requests per 60 seconds per IP
  const rateCheck = checkRateLimit(`analytics:${ip}`, 100, 60_000)
  if (!rateCheck.allowed) {
    return c.json({ error: 'Too many requests' }, 429)
  }

  // Use provided visitorId or generate a new one
  const visitorId = body.visitorId || uuid()

  const restaurant = await c.env.DB.prepare(
    "SELECT id FROM restaurants WHERE id = ? AND status IN ('active','demo')"
  ).bind(body.restaurantId).first()
  if (!restaurant) {
    return c.json({ error: 'Restaurant not found' }, 404)
  }

  await trackPageView(c.env.DB, body.restaurantId, body.page, visitorId, body.referrer || '')
  return c.json({ success: true, visitorId })
})

// GET /:id/stats — get analytics stats for a restaurant
app.get('/:id/stats', jwtAuth, restaurantAccess, async (c) => {
  const id = c.req.param('id')
  const stats = await getAnalyticsStats(c.env.DB, id)
  return c.json(stats)
})

export default app
