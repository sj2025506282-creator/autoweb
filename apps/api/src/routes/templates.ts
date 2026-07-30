import { Hono } from 'hono'
import { jwtAuth } from '../middleware/auth'

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>()

app.get('/', jwtAuth, async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM templates ORDER BY name ASC'
  ).all()
  return c.json(result.results)
})

export default app
