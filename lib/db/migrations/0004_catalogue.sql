-- Catalogue, prices and services live in D1 so the desktop admin app and the web app
-- read the same source of truth.

CREATE TABLE IF NOT EXISTS catalogue_items (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  spec TEXT,
  tier TEXT,
  relevance TEXT,
  keywords TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_catalogue_category ON catalogue_items(category);
CREATE INDEX IF NOT EXISTS idx_catalogue_name ON catalogue_items(name);

CREATE TABLE IF NOT EXISTS catalogue_prices (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES catalogue_items(id) ON DELETE CASCADE,
  price_ghs REAL NOT NULL CHECK (price_ghs >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  source TEXT,
  note TEXT,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_catalogue_prices_item ON catalogue_prices(item_id, effective_from DESC);

CREATE TABLE IF NOT EXISTS service_prices (
  id TEXT PRIMARY KEY,
  service_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  price_ghs REAL NOT NULL CHECK (price_ghs >= 0),
  currency TEXT NOT NULL DEFAULT 'GHS',
  note TEXT,
  effective_from TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,
  actor_key TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
