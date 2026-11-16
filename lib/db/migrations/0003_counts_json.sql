-- Editable selections travel with the estimate so a project can be reopened.
ALTER TABLE estimates ADD COLUMN counts_json TEXT;
