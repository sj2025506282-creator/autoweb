ALTER TABLE restaurants ADD COLUMN google_place_id TEXT;
ALTER TABLE restaurants ADD COLUMN source_url TEXT DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_google_place_id
  ON restaurants(google_place_id)
  WHERE google_place_id IS NOT NULL AND google_place_id != '';
