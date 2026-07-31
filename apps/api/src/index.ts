import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import restaurantRoutes from './routes/restaurants'
import menuRoutes from './routes/menu'
import reservationRoutes from './routes/reservations'
import outreachRoutes from './routes/outreach'
import templateRoutes from './routes/templates'
import imageRoutes from './routes/images'
import analyticsRoutes from './routes/analytics'
import reserveRoutes from './routes/reserve'
import siteRoutes from './routes/site'

type Bindings = {
  DB: D1Database
  IMAGES: R2Bucket
  JWT_SECRET: string
  RESEND_API_KEY: string
  GOOGLE_PLACES_API_KEY: string
  ALLOWED_ORIGINS?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: (origin, c) => {
    const configured = c.env.ALLOWED_ORIGINS?.split(',')
      .map((value: string) => value.trim())
      .filter(Boolean) || []
    const allowed = new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...configured,
    ])
    return allowed.has(origin) ? origin : ''
  },
  credentials: true,
}))

app.route('/api/auth', authRoutes)
app.route('/api/restaurants', restaurantRoutes)
app.route('/api/restaurants', menuRoutes)
app.route('/api/restaurants', reservationRoutes)
app.route('/api/outreach', outreachRoutes)
app.route('/api/templates', templateRoutes)
app.route('/api/images', imageRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/reserve', reserveRoutes)
app.route('/api/site', siteRoutes)

export default app
