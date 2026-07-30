import { v4 as uuid } from 'uuid'

export async function trackPageView(
  db: D1Database,
  restaurantId: string,
  page: string,
  visitorId: string,
  referrer: string = ''
) {
  await db.prepare(
    'INSERT INTO analytics_events (id, restaurant_id, page, visitor_id, referrer) VALUES (?, ?, ?, ?, ?)'
  ).bind(uuid(), restaurantId, page, visitorId, referrer).run()
}

export async function getAnalyticsStats(db: D1Database, restaurantId: string) {
  const pv = await db
    .prepare('SELECT COUNT(*) as count FROM analytics_events WHERE restaurant_id = ?')
    .bind(restaurantId)
    .first<{ count: number }>()
  const uv = await db
    .prepare('SELECT COUNT(DISTINCT visitor_id) as count FROM analytics_events WHERE restaurant_id = ?')
    .bind(restaurantId)
    .first<{ count: number }>()
  const byDay = await db
    .prepare(
      `SELECT date(created_at) as day, COUNT(*) as views
       FROM analytics_events
       WHERE restaurant_id = ?
       GROUP BY day
       ORDER BY day DESC
       LIMIT 30`
    )
    .bind(restaurantId)
    .all()
  const topPages = await db
    .prepare(
      `SELECT page, COUNT(*) as views
       FROM analytics_events
       WHERE restaurant_id = ?
       GROUP BY page
       ORDER BY views DESC
       LIMIT 10`
    )
    .bind(restaurantId)
    .all()
  const topReferrers = await db
    .prepare(
      `SELECT referrer, COUNT(*) as views
       FROM analytics_events
       WHERE restaurant_id = ? AND referrer != ''
       GROUP BY referrer
       ORDER BY views DESC
       LIMIT 10`
    )
    .bind(restaurantId)
    .all()
  return {
    pv: pv?.count ?? 0,
    uv: uv?.count ?? 0,
    byDay: byDay.results as { day: string; views: number }[],
    topPages: topPages.results as { page: string; views: number }[],
    topReferrers: topReferrers.results as { referrer: string; views: number }[],
  }
}
