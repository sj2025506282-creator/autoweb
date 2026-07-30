-- migrations/0001_init.sql
CREATE TABLE IF NOT EXISTS restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  opening_hours TEXT DEFAULT '{}',
  cover_image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  template_id TEXT DEFAULT 'template-1',
  domain_custom TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK(status IN ('active','draft','demo')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL DEFAULT 0,
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  config TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  party_size INTEGER DEFAULT 2,
  reservation_time TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('admin','owner'))
);

CREATE TABLE IF NOT EXISTS image_tasks (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  enhanced_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','done','rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  page TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed templates
INSERT INTO templates (id, name, config) VALUES
  ('template-1', 'Classic Elegance', '{"primaryColor":"#1a1a2e","secondaryColor":"#e94560","fontFamily":"serif","layout":"standard"}'),
  ('template-2', 'Modern Minimal', '{"primaryColor":"#2d3436","secondaryColor":"#0984e3","fontFamily":"sans-serif","layout":"standard"}'),
  ('template-3', 'Warm Rustic', '{"primaryColor":"#8b4513","secondaryColor":"#f4a460","fontFamily":"serif","layout":"hero-first"}'),
  ('template-4', 'Fresh Green', '{"primaryColor":"#2d5016","secondaryColor":"#7ec850","fontFamily":"sans-serif","layout":"split"}'),
  ('template-5', 'Bold Dark', '{"primaryColor":"#0a0a0a","secondaryColor":"#ff6b35","fontFamily":"sans-serif","layout":"full-bleed"}');

-- Seed admin user (password: 'password' — change on first login)
INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES ('admin-001', 'admin@autoweb.app', 'e524fe0863799ba731029df985a9c51d:d7fd8c530862b481caeb9ad9bf1627ad04eed6291953bf6639d653f8c9548493', 'admin');
