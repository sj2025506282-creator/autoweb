import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { jwtAuth, restaurantAccess } from '../middleware/auth'
import { v4 as uuid } from 'uuid'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

// GET /:id/menu — get menu for a restaurant
app.get('/:id/menu', async (c) => {
  const id = c.req.param('id')

  // Verify restaurant exists
  const restaurant = await c.env.DB.prepare(
    "SELECT id FROM restaurants WHERE id = ? AND status IN ('active','demo')"
  ).bind(id).first()
  if (!restaurant) return c.json({ error: 'Not found' }, 404)

  const categories = await c.env.DB.prepare(
    'SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order'
  ).bind(id).all()

  const items = await c.env.DB.prepare(
    `SELECT mi.* FROM menu_items mi
     JOIN menu_categories mc ON mi.category_id = mc.id
     WHERE mc.restaurant_id = ? ORDER BY mi.sort_order`
  ).bind(id).all()

  return c.json({
    categories: categories.results,
    items: items.results,
  })
})

const createSchema = z.object({
  type: z.enum(['category', 'item']),
  name: z.string().min(1).optional(),
  category_id: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  sort_order: z.number().optional(),
  image_url: z.string().optional(),
})

// POST /:id/menu — add category or item
app.post('/:id/menu', jwtAuth, restaurantAccess, zValidator('json', createSchema), async (c) => {
  const id = c.req.param('id')
  const body = c.req.valid('json')

  // Verify restaurant exists
  const restaurant = await c.env.DB.prepare(
    'SELECT id FROM restaurants WHERE id = ?'
  ).bind(id).first()
  if (!restaurant) return c.json({ error: 'Not found' }, 404)

  if (body.type === 'category') {
    if (!body.name || !body.name.trim()) {
      return c.json({ error: 'Category name is required' }, 400)
    }
    const categoryId = uuid()
    await c.env.DB.prepare(
      'INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES (?, ?, ?, ?)'
    ).bind(categoryId, id, body.name, body.sort_order || 0).run()
    return c.json({ id: categoryId }, 201)
  }

  if (body.type === 'item') {
    if (!body.category_id) {
      return c.json({ error: 'category_id is required for items' }, 400)
    }
    if (!body.name || !body.name.trim()) {
      return c.json({ error: 'Item name is required' }, 400)
    }

    // Verify the category belongs to this restaurant
    const category = await c.env.DB.prepare(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?'
    ).bind(body.category_id, id).first()
    if (!category) {
      return c.json({ error: 'Category not found' }, 400)
    }

    const itemId = uuid()
    await c.env.DB.prepare(
      'INSERT INTO menu_items (id, category_id, name, description, price, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(itemId, body.category_id, body.name, body.description || '', body.price || 0, body.image_url || '', body.sort_order || 0).run()
    return c.json({ id: itemId }, 201)
  }

  return c.json({ error: 'Invalid type' }, 400)
})

// DELETE /:id/menu — delete category or item (by query param)
app.delete('/:id/menu', jwtAuth, restaurantAccess, async (c) => {
  const id = c.req.param('id')
  const categoryId = c.req.query('categoryId')
  const itemId = c.req.query('itemId')

  if (itemId) {
    await c.env.DB.prepare(
      'DELETE FROM menu_items WHERE id = ? AND category_id IN (SELECT id FROM menu_categories WHERE restaurant_id = ?)'
    ).bind(itemId, id).run()
    return c.json({ success: true })
  }

  if (categoryId) {
    await c.env.DB.prepare(
      'DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?'
    ).bind(categoryId, id).run()
    return c.json({ success: true })
  }

  return c.json({ error: 'categoryId or itemId query parameter is required' }, 400)
})

const updateCategorySchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().optional(),
})

// PUT /:id/menu/:categoryId — update a category (fixes delete+create bug)
app.put('/:id/menu/:categoryId', jwtAuth, restaurantAccess, zValidator('json', updateCategorySchema), async (c) => {
  const id = c.req.param('id')
  const categoryId = c.req.param('categoryId')
  const body = c.req.valid('json')

  // Verify the category belongs to this restaurant
  const category = await c.env.DB.prepare(
    'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?'
  ).bind(categoryId, id).first()
  if (!category) {
    return c.json({ error: 'Category not found' }, 404)
  }

  await c.env.DB.prepare(
    'UPDATE menu_categories SET name = ?, sort_order = ? WHERE id = ?'
  ).bind(body.name, body.sort_order ?? 0, categoryId).run()

  return c.json({ success: true })
})

export default app
