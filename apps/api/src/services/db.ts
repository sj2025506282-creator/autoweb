export function queryAll<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T[]> {
  return db.prepare(sql).bind(...params).all().then(r => r.results as T[])
}

export function queryFirst<T>(db: D1Database, sql: string, params: unknown[] = []): Promise<T | null> {
  return db.prepare(sql).bind(...params).first<T>().then(r => r ?? null)
}

export function execute(db: D1Database, sql: string, params: unknown[] = []): Promise<void> {
  return db.prepare(sql).bind(...params).run().then(() => {})
}
