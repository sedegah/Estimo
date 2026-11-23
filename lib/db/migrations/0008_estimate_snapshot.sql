-- A saved estimate keeps its lines, spaces and special loads on the server, so the
-- browser is a cache rather than the only copy.
ALTER TABLE estimates ADD COLUMN snapshot_json TEXT;
