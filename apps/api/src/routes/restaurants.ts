import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { jwtAuth } from '../middleware/auth'
import { v4 as uuid } from 'uuid'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// GET — list all restaurants (admin), or a single restaurant
app.get('/', jwtAuth, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM restaurants ORDER BY created_at DESC'
  ).all()
  return c.json(result.results)
})

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  opening_hours: z.record(z.unknown()).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'demo']).optional(),
})

// POST — create a new restaurant
app.post('/', jwtAuth, zValidator('json', createSchema), async (c) => {
  const body = c.req.valid('json')
  const id = uuid()
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  await c.env.DB.prepare(
    `INSERT INTO restaurants (id, name, slug, phone, email, address, lat, lng, opening_hours, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.name, slug, body.phone || '', body.email || '', body.address || '',
    body.lat || 0, body.lng || 0, JSON.stringify(body.opening_hours || {}),
    body.description || '', body.status || 'draft').run()

  return c.json({ id, slug }, 201)
})

// GET /:id — get a single restaurant
app.get('/:id', jwtAuth, async (c) => {
  const id = c.req.param('id')
  const restaurant = await c.env.DB.prepare(
    'SELECT * FROM restaurants WHERE id = ?'
  ).bind(id).first()
  if (!restaurant) return c.json({ error: 'Not found' }, 404)
  return c.json(restaurant)
})

const updateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  opening_hours: z.record(z.unknown()).optional(),
  description: z.string().optional(),
  template_id: z.string().optional(),
  status: z.enum(['draft', 'active', 'demo']).optional(),
})

// PUT /:id — update a restaurant
app.put('/:id', jwtAuth, zValidator('json', updateSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const existing = await c.env.DB.prepare(
    'SELECT * FROM restaurants WHERE id = ?'
  ).bind(id).first() as Record<string, unknown> | null
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const name = body.name ?? existing.name as string
  const phone = body.phone ?? (existing.phone as string) ?? ''
  const email = body.email ?? (existing.email as string) ?? ''
  const address = body.address ?? (existing.address as string) ?? ''
  const lat = body.lat ?? (existing.lat as number) ?? 0
  const lng = body.lng ?? (existing.lng as number) ?? 0
  const opening_hours = body.opening_hours !== undefined ? JSON.stringify(body.opening_hours) : (existing.opening_hours as string) ?? '{}'
  const description = body.description ?? (existing.description as string) ?? ''
  const template_id = body.template_id ?? (existing.template_id as string) ?? 'template-1'
  const status = body.status ?? (existing.status as string) ?? 'draft'

  await c.env.DB.prepare(
    `UPDATE restaurants SET name=?, phone=?, email=?, address=?, lat=?, lng=?,
     opening_hours=?, description=?, template_id=?, status=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(name, phone, email, address, lat, lng, opening_hours,
    description, template_id, status, id).run()

  return c.json({ success: true })
})

// DELETE /:id — delete a restaurant
app.delete('/:id', jwtAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM restaurants WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export default app
