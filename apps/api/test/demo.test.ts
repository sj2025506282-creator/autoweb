import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  OWNER,
  apiRequest,
  authCookie,
  insertRestaurant,
  jsonRequest,
  resetDatabase,
} from './helpers'

function completeMenu(firstPrice = 8) {
  return Array.from({ length: 12 }, (_, index) => ({
    category: `Category ${Math.floor(index / 3) + 1}`,
    name: `Dish ${index + 1}`,
    description: `A complete description for dish ${index + 1}`,
    price: index === 0 ? firstPrice : 10 + index,
    imageUrl: `https://images.example.com/dish-${index + 1}.jpg`,
  }))
}

const verifiedMenu = {
  menuSourceUrl: 'https://restaurant.example.com/menu',
  menuVerified: true as const,
}

describe('feature: demo generation and duplicate prevention', () => {
  beforeEach(resetDatabase)

  it('01 rejects unauthenticated demo creation', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', { name: 'Cafe' })
    expect(response.status).toBe(401)
  })

  it('02 rejects owner demo creation', async () => {
    const response = await jsonRequest(
      '/api/outreach',
      'POST',
      { name: 'Cafe' },
      await authCookie(OWNER),
    )
    expect(response.status).toBe(403)
  })

  it('03 validates that a restaurant name is present', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {}, await authCookie())
    expect(response.status).toBe(400)
  })

  it('04 creates a demo with imported source data', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Imported Cafe',
      phone: '+1 555 0102',
      address: '10 Test Road',
      googlePlaceId: 'google-10',
      sourceUrl: 'https://maps.google.com/test',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    const body = await response.json() as { id: string; slug: string }
    const row = await env.DB.prepare(
      'SELECT * FROM restaurants WHERE id = ?'
    ).bind(body.id).first<Record<string, unknown>>()
    expect(response.status).toBe(201)
    expect(row).toMatchObject({
      status: 'demo',
      slug: 'imported-cafe',
      google_place_id: 'google-10',
    })
  })

  it('05 creates menu items atomically with the demo', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Menu Cafe',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    const { id } = await response.json() as { id: string }
    const count = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE mc.restaurant_id = ?`
    ).bind(id).first<{ count: number }>()
    expect(count?.count).toBe(12)
  })

  it('06 rejects a duplicate Google Place ID', async () => {
    await insertRestaurant({ googlePlaceId: 'duplicate-place' })
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Duplicate',
      googlePlaceId: 'duplicate-place',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({
      existing: { id: 'restaurant-1', status: 'demo' },
    })
  })

  it('07 creates a unique slug when the base slug is occupied', async () => {
    await insertRestaurant({ slug: 'same-name', googlePlaceId: 'existing' })
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Same Name',
      googlePlaceId: 'new-place',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(await response.json()).toMatchObject({ slug: 'same-name-2' })
  })

  it('08 uses a safe fallback slug for non-Latin names', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: '测试餐厅',
      googlePlaceId: 'non-latin',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(await response.json()).toMatchObject({ slug: 'restaurant' })
  })

  it('09 rejects malformed Google Maps source URLs', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Bad URL Cafe',
      sourceUrl: 'not-a-url',
    }, await authCookie())
    expect(response.status).toBe(400)
  })

  it('10 lists only demos awaiting review', async () => {
    await insertRestaurant({ id: 'demo-1', googlePlaceId: 'demo-p', status: 'demo' })
    await insertRestaurant({
      id: 'active-1',
      slug: 'active-one',
      googlePlaceId: 'active-p',
      status: 'active',
    })
    const response = await apiRequest('/api/outreach', {
      headers: { Cookie: await authCookie() },
    })
    const body = await response.json() as Array<{ id: string }>
    expect(body.map((row) => row.id)).toEqual(['demo-1'])
  })

  it('11 preserves decimal menu prices', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Decimal Cafe',
      ...verifiedMenu,
      menuItems: completeMenu(4.75),
    }, await authCookie())
    const { id } = await response.json() as { id: string }
    const row = await env.DB.prepare(
      `SELECT mi.price FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE mc.restaurant_id = ?`
    ).bind(id).first<{ price: number }>()
    expect(row?.price).toBe(4.75)
  })

  it('12 accepts a valid internationalized source URL', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'International Cafe',
      googlePlaceId: 'international-url',
      sourceUrl: 'https://例子.测试/餐厅',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(response.status).toBe(201)
  })

  it('13 rejects source URLs longer than 2048 characters', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Long URL Cafe',
      sourceUrl: `https://example.com/${'a'.repeat(2050)}`,
    }, await authCookie())
    expect(response.status).toBe(400)
  })

  it('14 permits only one concurrent import for a Google place', async () => {
    const cookie = await authCookie()
    const payload = {
      name: 'Concurrent Cafe',
      googlePlaceId: 'same-concurrent-place',
      ...verifiedMenu,
      menuItems: completeMenu(),
    }
    const responses = await Promise.all([
      jsonRequest('/api/outreach', 'POST', payload, cookie),
      jsonRequest('/api/outreach', 'POST', payload, cookie),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([201, 409])
    const count = await env.DB.prepare(
      'SELECT COUNT(*) AS count FROM restaurants WHERE google_place_id = ?',
    ).bind(payload.googlePlaceId).first<{ count: number }>()
    expect(count?.count).toBe(1)
  })

  it('15 rejects demos with fewer than 12 menu items', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Thin Menu Cafe',
      ...verifiedMenu,
      menuItems: completeMenu().slice(0, 8),
    }, await authCookie())
    expect(response.status).toBe(400)
  })

  it('16 rejects demos with fewer than 4 menu categories', async () => {
    const menuItems = completeMenu().map((item) => ({ ...item, category: 'Menu' }))
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'One Category Cafe',
      ...verifiedMenu,
      menuItems,
    }, await authCookie())
    expect(response.status).toBe(400)
  })

  it('17 rejects menus without a public source URL', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Unsourced Cafe',
      menuVerified: true,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(response.status).toBe(400)
  })

  it('18 rejects menus that were not explicitly verified', async () => {
    const response = await jsonRequest('/api/outreach', 'POST', {
      name: 'Unchecked Cafe',
      menuSourceUrl: verifiedMenu.menuSourceUrl,
      menuItems: completeMenu(),
    }, await authCookie())
    expect(response.status).toBe(400)
  })
})
