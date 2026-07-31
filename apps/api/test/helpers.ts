import { env } from 'cloudflare:workers'
import app from '../src'
import { signToken } from '../src/middleware/auth'
import type { SessionUser } from '@autoweb/shared'

export const ADMIN = {
  id: 'test-admin',
  email: 'admin@example.test',
  role: 'admin' as const,
}

export const OWNER = {
  id: 'test-owner',
  email: 'owner@example.test',
  role: 'owner' as const,
  restaurantId: 'owner-restaurant',
}

export async function authCookie(user: SessionUser = ADMIN): Promise<string> {
  const token = await signToken(user, env.JWT_SECRET)
  return `auth_token=${token}`
}

export async function apiRequest(
  path: string,
  init: RequestInit = {},
  bindings: Partial<typeof env> = {},
): Promise<Response> {
  return app.request(
    `http://autoweb.test${path}`,
    init,
    { ...env, ...bindings },
  )
}

export async function jsonRequest(
  path: string,
  method: string,
  body: unknown,
  cookie?: string,
  bindings: Partial<typeof env> = {},
): Promise<Response> {
  return apiRequest(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  }, bindings)
}

export async function resetDatabase(): Promise<void> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM analytics_events'),
    env.DB.prepare('DELETE FROM reservations'),
    env.DB.prepare('DELETE FROM menu_items'),
    env.DB.prepare('DELETE FROM menu_categories'),
    env.DB.prepare('DELETE FROM image_tasks'),
    env.DB.prepare('DELETE FROM users'),
    env.DB.prepare('DELETE FROM restaurants'),
  ])
}

export async function insertRestaurant(overrides: Record<string, unknown> = {}) {
  const restaurant = {
    id: 'restaurant-1',
    name: 'Test Bistro',
    slug: 'test-bistro',
    phone: '+1 555 0100',
    email: 'owner@example.test',
    address: '1 Test Street',
    status: 'demo',
    googlePlaceId: 'place-1',
    ...overrides,
  }
  await env.DB.prepare(
    `INSERT INTO restaurants (
      id, name, slug, phone, email, address, status, google_place_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    restaurant.id,
    restaurant.name,
    restaurant.slug,
    restaurant.phone,
    restaurant.email,
    restaurant.address,
    restaurant.status,
    restaurant.googlePlaceId,
  ).run()
  return restaurant
}
