-- ESTIMO D1 schema (SQLite). Applied by tools/d1-setup.mjs.
PRAGMA foreign_keys = ON;

-- Clerk owns identity; we mirror the minimum needed for the app.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Clerk user id (user_…)
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'homeowner', -- homeowner | electrician | business
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'standard',
  spaces INTEGER NOT NULL DEFAULT 0,
  total_ghs REAL,
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | estimated
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_estimates_user ON estimates(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS estimate_items (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  amount_ghs REAL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_estimate_items_estimate ON estimate_items(estimate_id);

CREATE TABLE IF NOT EXISTS saved_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  quality TEXT NOT NULL DEFAULT 'standard',
  spaces INTEGER NOT NULL DEFAULT 0,
  total_ghs REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_projects_user ON saved_projects(user_id, created_at DESC);
