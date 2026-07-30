import { Hono } from 'hono'

const app = new Hono<{ Bindings: { DB: D1Database } }>()

// GET /:hostname — resolve restaurant from hostname (public, for SSR)
app.get('/:hostname', async (c) => {
  const hostname = c.req.param('hostname')

  // Try custom domain first
  let restaurant = await c.env.DB.prepare(
    "SELECT * FROM restaurants WHERE domain_custom = ? AND status IN ('active','demo')"
  ).bind(hostname).first()

  // Try subdomain (extract slug from hostname like my-restaurant.autoweb.app)
  if (!restaurant) {
    const slug = hostname.split('.')[0]
    restaurant = await c.env.DB.prepare(
      "SELECT * FROM restaurants WHERE slug = ? AND status IN ('active','demo')"
    ).bind(slug).first()
  }

  if (!restaurant) {
    return c.json({ error: 'Restaurant not found' }, 404)
  }

  return c.json(restaurant)
})

export default app
