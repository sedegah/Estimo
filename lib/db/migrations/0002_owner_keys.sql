-- Per-user isolation for the API worker.
-- D1 is SQLite and has no row-level security, so ownership is enforced in the worker:
-- every row carries an owner_key (a salted SHA-256 of the Clerk user id) and every
-- statement filters on it.

ALTER TABLE estimates ADD COLUMN owner_key TEXT;
ALTER TABLE saved_projects ADD COLUMN owner_key TEXT;

CREATE INDEX IF NOT EXISTS idx_estimates_owner ON estimates(owner_key, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_projects_owner ON saved_projects(owner_key, created_at DESC);
