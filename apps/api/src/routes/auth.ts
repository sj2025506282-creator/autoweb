import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { signToken, jwtAuth } from '../middleware/auth'
import { verifyPassword } from '../services/password'
import { checkRateLimit } from '../services/rate-limiter'
import type { SessionUser } from '@autoweb/shared'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  // Rate limiting: 5 attempts per IP per 15 minutes
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || 'unknown'
  const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Too many login attempts. Please try again later.' }, 429)
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<{
    id: string; email: string; password_hash: string; role: string; restaurant_id: string | null
  }>()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const VALID_ROLES = new Set(['admin', 'owner'])
  if (!VALID_ROLES.has(user.role)) {
    return c.json({ error: 'Invalid user role' }, 500)
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role as 'admin' | 'owner',
    restaurantId: user.restaurant_id ?? undefined,
  }

  const token = await signToken(sessionUser, c.env.JWT_SECRET)
  c.header('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`)
  return c.json({ success: true, role: user.role, user: sessionUser })
})

app.post('/logout', async (c) => {
  c.header('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
  return c.json({ success: true })
})

app.get('/me', jwtAuth, (c) => {
  return c.json(c.get('user'))
})

export default app
