-- Daily exchange rates for display conversion (base currency is the cedi).
CREATE TABLE IF NOT EXISTS exchange_rates (
  base TEXT NOT NULL,
  code TEXT NOT NULL,
  rate REAL NOT NULL CHECK (rate > 0),
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (base, code)
);

INSERT INTO exchange_rates (base, code, rate, fetched_at)
VALUES
  ('GHS', 'USD', 0.084167, datetime('now')),
  ('GHS', 'GBP', 0.064139, datetime('now')),
  ('GHS', 'EUR', 0.076632, datetime('now'))
ON CONFLICT(base, code) DO NOTHING;
