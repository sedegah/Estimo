-- Correct the 1.5 mm² copper single-core price.
--
-- The admin-console entry of 20 Nov 2026 put it at GHS 25.00/m while the same range's
-- 2.5 mm² cable is GHS 6.00/m, the 1.5 mm² earth cable GHS 3.20/m and 1.5 mm² twin & earth
-- GHS 4.00/m. The research note behind the November seed puts 1.5 mm² single-core at
-- GH₵145–380 per 90 m, i.e. GHS 1.60–4.20/m.
--
-- Prices are effective-dated, so this supersedes the old row without deleting history.

INSERT INTO catalogue_prices (id, item_id, price_ghs, currency, source, note, effective_from, updated_by)
VALUES (
  'prc-cu-1p5-corrected-20261126',
  'mat-cab-sc-cu-1p5',
  3.50,
  'GHS',
  'Ghana market research (₵145–380 / 90 m)',
  'Corrected: the 20 Nov admin entry (GHS 25.00/m) was several times the market for 1.5 mm² single-core',
  datetime('now'),
  'seed'
);
