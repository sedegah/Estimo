-- Product photo for a catalogue item, stored as an R2 object key (materials/<id>.jpg).
ALTER TABLE catalogue_items ADD COLUMN image_key TEXT;
