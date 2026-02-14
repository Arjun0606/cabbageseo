-- Fix: market_share_snapshots upsert requires a unique constraint on (site_id, snapshot_date)
-- Without this, the upsert silently fails and no history data is saved.

-- First, deduplicate any existing rows (keep the latest one per site+date)
DELETE FROM market_share_snapshots a
USING market_share_snapshots b
WHERE a.site_id = b.site_id
  AND a.snapshot_date::date = b.snapshot_date::date
  AND a.created_at < b.created_at;

-- Now add the unique index
CREATE UNIQUE INDEX IF NOT EXISTS "market_share_site_date_unique"
  ON "market_share_snapshots" ("site_id", "snapshot_date");
