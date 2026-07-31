import { createMiddleware } from 'hono/factory'
import { jwtVerify, SignJWT } from 'jose'
import type { SessionUser } from '@autoweb/shared'

const encoder = new TextEncoder()

export async function signToken(user: SessionUser, secret: string): Promise<string> {
  const payload: Record<string, unknown> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  }
  if (user.restaurantId) {
    payload.restaurantId = user.restaurantId
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(encoder.encode(secret))
}

export async function verifyToken(token: string, secret: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret))
    if (
      typeof payload.sub !== 'string'
      || typeof payload.email !== 'string'
      || (payload.role !== 'admin' && payload.role !== 'owner')
      || (payload.restaurantId !== undefined && typeof payload.restaurantId !== 'string')
    ) {
      return null
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    }
  } catch {
    return null
  }
}

export const jwtAuth = createMiddleware<{
  Bindings: { JWT_SECRET: string }
  Variables: { user: SessionUser }
}>(async (c, next) => {
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/auth_token=([^;]+)/)
  if (!match) return c.json({ error: 'Unauthorized' }, 401)
  const user = await verifyToken(match[1], c.env.JWT_SECRET)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  await next()
})

export const adminOnly = createMiddleware<{
  Bindings: { JWT_SECRET: string }
  Variables: { user: SessionUser }
}>(async (c, next) => {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
})

export const restaurantAccess = createMiddleware<{
  Bindings: { JWT_SECRET: string }
  Variables: { user: SessionUser }
}>(async (c, next) => {
  const user = c.get('user')
  const restaurantId = c.req.param('id')
  if (
    !user
    || (user.role !== 'admin' && (!user.restaurantId || user.restaurantId !== restaurantId))
  ) {
    return c.json({ error: 'Restaurant access denied' }, 403)
  }
  await next()
})
