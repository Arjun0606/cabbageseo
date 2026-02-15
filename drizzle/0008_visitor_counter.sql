-- Visitor counter for homepage "visitor number" display
CREATE TABLE IF NOT EXISTS "counters" (
  "name" text PRIMARY KEY,
  "value" bigint NOT NULL DEFAULT 0
);

-- Seed the visitor counter
INSERT INTO "counters" ("name", "value") VALUES ('visitors', 0)
ON CONFLICT ("name") DO NOTHING;

-- Atomic increment function (returns new value)
CREATE OR REPLACE FUNCTION increment_counter(counter_name text)
RETURNS bigint AS $$
DECLARE
  new_val bigint;
BEGIN
  UPDATE counters SET value = value + 1 WHERE name = counter_name RETURNING value INTO new_val;
  RETURN new_val;
END;
$$ LANGUAGE plpgsql;
