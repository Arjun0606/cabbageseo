-- Track how many sites an org has created in the current billing period
-- Prevents abuse: Scout users can't delete and re-add a different site every day
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sites_created_this_period integer DEFAULT 0;
