import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { jwtAuth } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// GET /:id/reservations — list reservations (admin/owner)
app.get('/:id/reservations', jwtAuth, async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')

  if (user.role !== 'admin' && user.restaurantId !== id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const date = c.req.query('date')

  let sql = 'SELECT * FROM reservations WHERE restaurant_id = ?'
  const binds: unknown[] = [id]

  if (date) {
    sql += ' AND date(reservation_time) = ?'
    binds.push(date)
  }

  sql += ' ORDER BY reservation_time DESC'
  const result = await c.env.DB.prepare(sql).bind(...binds).all()
  return c.json(result.results)
})

const reservationSchema = z.object({
  customer_name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  party_size: z.number().optional(),
  reservation_time: z.string().min(1),
  note: z.string().optional(),
})

// POST /:id/reservations — create reservation (public)
app.post('/:id/reservations', zValidator('json', reservationSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  // Verify the restaurant exists and is active
  const restaurant = await c.env.DB.prepare(
    "SELECT id FROM restaurants WHERE id = ? AND status IN ('active','demo')"
  ).bind(id).first()

  if (!restaurant) {
    return c.json({ error: 'Restaurant not found' }, 404)
  }

  const reservationId = uuidv4()

  await c.env.DB.prepare(
    `INSERT INTO reservations (id, restaurant_id, customer_name, phone, email, party_size, reservation_time, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    reservationId,
    id,
    body.customer_name,
    body.phone || '',
    body.email || '',
    body.party_size || 2,
    body.reservation_time,
    body.note || ''
  ).run()

  return c.json(
    { id: reservationId, message: 'Reservation created successfully' },
    201
  )
})

export default app
