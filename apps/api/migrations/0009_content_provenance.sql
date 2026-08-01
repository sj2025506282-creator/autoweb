ALTER TABLE restaurants ADD COLUMN content_source_url TEXT NOT NULL DEFAULT '';
ALTER TABLE restaurants ADD COLUMN content_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN image_rights_confirmed INTEGER NOT NULL DEFAULT 0;
