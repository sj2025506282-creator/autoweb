import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ADMIN,
  OWNER,
  apiRequest,
  authCookie,
  insertRestaurant,
  jsonRequest,
  resetDatabase,
} from './helpers'

describe('feature: authentication and restaurant authorization boundaries', () => {
  beforeEach(resetDatabase)

  it('01 rejects protected restaurant listing without a session', async () => {
    expect((await apiRequest('/api/restaurants')).status).toBe(401)
  })

  it('02 lets admins list all restaurants', async () => {
    await insertRestaurant()
    const response = await apiRequest('/api/restaurants', {
      headers: { Cookie: await authCookie(ADMIN) },
    })
    expect(response.status).toBe(200)
    expect((await response.json() as unknown[])).toHaveLength(1)
  })

  it('03 limits owners to their assigned restaurant in listings', async () => {
    await insertRestaurant({
      id: OWNER.restaurantId,
      slug: 'owner-site',
      googlePlaceId: 'owner-place',
    })
    await insertRestaurant({
      id: 'other-restaurant',
      slug: 'other-site',
      googlePlaceId: 'other-place',
    })
    const response = await apiRequest('/api/restaurants', {
      headers: { Cookie: await authCookie(OWNER) },
    })
    const rows = await response.json() as Array<{ id: string }>
    expect(rows.map((row) => row.id)).toEqual([OWNER.restaurantId])
  })

  it('04 denies an owner access to another restaurant detail', async () => {
    await insertRestaurant()
    const response = await apiRequest('/api/restaurants/restaurant-1', {
      headers: { Cookie: await authCookie(OWNER) },
    })
    expect(response.status).toBe(403)
  })

  it('05 lets an owner access their assigned restaurant detail', async () => {
    await insertRestaurant({
      id: OWNER.restaurantId,
      slug: 'owner-site',
      googlePlaceId: 'owner-place',
    })
    const response = await apiRequest(`/api/restaurants/${OWNER.restaurantId}`, {
      headers: { Cookie: await authCookie(OWNER) },
    })
    expect(response.status).toBe(200)
  })

  it('06 denies restaurant creation to owners', async () => {
    const response = await jsonRequest(
      '/api/restaurants',
      'POST',
      { name: 'Unauthorized Cafe' },
      await authCookie(OWNER),
    )
    expect(response.status).toBe(403)
  })

  it('07 denies restaurant deletion to owners', async () => {
    await insertRestaurant({
      id: OWNER.restaurantId,
      slug: 'owner-site',
      googlePlaceId: 'owner-place',
    })
    const response = await apiRequest(`/api/restaurants/${OWNER.restaurantId}`, {
      method: 'DELETE',
      headers: { Cookie: await authCookie(OWNER) },
    })
    expect(response.status).toBe(403)
  })

  it('08 hides draft menus from public requests', async () => {
    await insertRestaurant({ status: 'draft' })
    const response = await apiRequest('/api/restaurants/restaurant-1/menu')
    expect(response.status).toBe(404)
  })

  it('09 denies menu mutations for another restaurant', async () => {
    await insertRestaurant()
    const response = await jsonRequest(
      '/api/restaurants/restaurant-1/menu',
      'POST',
      { type: 'category', name: 'Dinner' },
      await authCookie(OWNER),
    )
    expect(response.status).toBe(403)
  })

  it('10 denies analytics access for another restaurant', async () => {
    await insertRestaurant()
    const response = await apiRequest('/api/analytics/restaurant-1/stats', {
      headers: { Cookie: await authCookie(OWNER) },
    })
    expect(response.status).toBe(403)
  })

  it('11 denies image uploads for another restaurant', async () => {
    await insertRestaurant()
    const form = new FormData()
    form.set('restaurantId', 'restaurant-1')
    form.set('file', new File(['image'], 'image.png', { type: 'image/png' }))
    const response = await apiRequest('/api/images/upload', {
      method: 'POST',
      headers: { Cookie: await authCookie(OWNER) },
      body: form,
    })
    expect(response.status).toBe(403)
    const objects = await env.IMAGES.list()
    expect(objects.objects).toHaveLength(0)
  })

  it('12 returns an empty public menu envelope for a demo', async () => {
    await insertRestaurant()
    const response = await apiRequest('/api/restaurants/restaurant-1/menu')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ categories: [], items: [] })
  })

  it('13 includes the category name with public menu items', async () => {
    await insertRestaurant()
    await env.DB.prepare(
      'INSERT INTO menu_categories (id, restaurant_id, name) VALUES (?, ?, ?)',
    ).bind('category-1', 'restaurant-1', 'Dinner').run()
    await env.DB.prepare(
      'INSERT INTO menu_items (id, category_id, name, price) VALUES (?, ?, ?, ?)',
    ).bind('item-1', 'category-1', 'House Special', 18).run()
    const response = await apiRequest('/api/restaurants/restaurant-1/menu')
    const data = await response.json() as {
      items: Array<{ name: string; category_name: string }>
    }
    expect(data.items).toMatchObject([
      { name: 'House Special', category_name: 'Dinner' },
    ])
  })
})
