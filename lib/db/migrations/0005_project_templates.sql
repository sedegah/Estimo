-- Plans built in the desktop admin, so the team can reopen them instead of
-- rebuilding from scratch. The website can later start an estimate from one.
CREATE TABLE IF NOT EXISTS project_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  preset TEXT,
  plan_json TEXT NOT NULL,
  totals_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_updated ON project_templates(updated_at DESC);
