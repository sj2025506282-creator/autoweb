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
    return {
      id: payload.sub!,
      email: payload.email as string,
      role: payload.role as 'admin' | 'owner',
      restaurantId: payload.restaurantId as string | undefined,
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
