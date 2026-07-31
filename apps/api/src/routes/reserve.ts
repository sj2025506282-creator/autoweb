import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { sendEmail, reservationEmailTemplate } from '../services/email'
import { checkRateLimit } from '../services/rate-limiter'

const reserveSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(40),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  partySize: z.number().int().min(1).max(20).default(2),
  reservationTime: z.string().min(1).max(40),
  note: z.string().trim().max(1000).optional(),
})

const app = new Hono<{ Bindings: { DB: D1Database; RESEND_API_KEY: string } }>()

app.post('/', zValidator('json', reserveSchema), async (c) => {
  const body = c.req.valid('json')
  const ip = c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  const rateLimit = checkRateLimit(`reservation:${ip}`, 10, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Too many reservation attempts. Please try again later.' }, 429)
  }

  const reservationDate = new Date(body.reservationTime)
  if (Number.isNaN(reservationDate.getTime()) || reservationDate.getTime() < Date.now()) {
    return c.json({ error: 'Reservation time must be a valid future date.' }, 400)
  }

  const restaurant = await c.env.DB.prepare(
    "SELECT id, name, email FROM restaurants WHERE id = ? AND status IN ('active','demo')"
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
    body.partySize,
    body.reservationTime,
    body.note || ''
  ).run()

  let notificationSent = false
  if (restaurant.email && c.env.RESEND_API_KEY) {
    try {
      const result = await sendEmail(c.env.RESEND_API_KEY, {
        to: restaurant.email,
        subject: `New Reservation — ${body.customerName}`,
        html: reservationEmailTemplate({
          restaurantName: restaurant.name,
          customerName: body.customerName,
          phone: body.phone,
          email: body.email || '',
          partySize: body.partySize,
          time: body.reservationTime,
          note: body.note || '',
        }),
      })
      notificationSent = !result.error
      if (result.error) console.error('Reservation email rejected', result.error)
    } catch (error) {
      console.error('Reservation saved but notification failed', id, error)
    }
  }

  return c.json({ success: true, id, notificationSent }, 201)
})

export default app
