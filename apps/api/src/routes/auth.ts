import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { signToken, jwtAuth } from '../middleware/auth'
import { hashPassword, verifyPassword } from '../services/password'
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
  const secure = new URL(c.req.url).protocol === 'https:' ? '; Secure' : ''
  c.header('Set-Cookie', `auth_token=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=86400`)
  return c.json({ success: true, role: user.role, user: sessionUser })
})

app.post('/logout', async (c) => {
  const secure = new URL(c.req.url).protocol === 'https:' ? '; Secure' : ''
  c.header('Set-Cookie', `auth_token=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`)
  return c.json({ success: true })
})

app.get('/me', jwtAuth, (c) => {
  return c.json(c.get('user'))
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string()
    .min(12)
    .max(200)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

app.post('/change-password', jwtAuth, zValidator('json', changePasswordSchema), async (c) => {
  const { currentPassword, newPassword } = c.req.valid('json')
  const user = c.get('user')
  const record = await c.env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.id).first<{ password_hash: string }>()

  if (!record || !(await verifyPassword(currentPassword, record.password_hash))) {
    return c.json({ error: 'Current password is incorrect' }, 401)
  }

  const passwordHash = await hashPassword(newPassword)
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ? WHERE id = ?'
  ).bind(passwordHash, user.id).run()
  return c.json({ success: true })
})

export default app
