import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { sendEmail, reservationEmailTemplate } from '../services/email'

const reserveSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  partySize: z.number().optional(),
  reservationTime: z.string().min(1),
  note: z.string().optional(),
})

const app = new Hono<{ Bindings: { DB: D1Database; RESEND_API_KEY: string } }>()

app.post('/', zValidator('json', reserveSchema), async (c) => {
  const body = c.req.valid('json')

  const restaurant = await c.env.DB.prepare(
    'SELECT id, name, email FROM restaurants WHERE id = ?'
  ).bind(body.restaurantId).first<{ id: string; name: string; email: string }>()

  if (!restaurant) {
    return c.json({ error: 'Restaurant not found' }, 404)
  }

  const id = uuid()

  await c.env.DB.prepare(
    `INSERT INTO reservations (id, restaurant_id, customer_name, phone, email, party_size, reservation_time, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.restaurantId,
    body.customerName,
    body.phone,
    body.email || '',
    body.partySize || 2,
    body.reservationTime,
    body.note || ''
  ).run()

  if (restaurant.email) {
    await sendEmail(c.env.RESEND_API_KEY, {
      to: restaurant.email,
      subject: `New Reservation — ${body.customerName}`,
      html: reservationEmailTemplate({
        restaurantName: restaurant.name,
        customerName: body.customerName,
        phone: body.phone,
        email: body.email || '',
        partySize: body.partySize || 2,
        time: body.reservationTime,
        note: body.note || '',
      }),
    })
  }

  return c.json({ success: true, id }, 201)
})

export default app
