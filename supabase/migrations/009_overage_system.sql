-- ============================================
-- OVERAGE SYSTEM
-- Pay-as-you-go with spending caps
-- ============================================

-- Add overage_settings to organizations
ALTER TABLE "organizations" 
ADD COLUMN IF NOT EXISTS "overage_settings" jsonb DEFAULT '{
  "enabled": false,
  "spendingCapCents": 0,
  "currentSpendCents": 0,
  "autoIncreaseEnabled": false,
  "autoIncreaseAmountCents": 5000,
  "notifyAt": [50, 80, 100],
  "lastNotifiedAt": null
}'::jsonb;

-- Create overage_charges table to track all overage usage
CREATE TABLE IF NOT EXISTS "overage_charges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "resource_type" text NOT NULL, -- articles, keywords, audits, aioAnalyses, aiCredits, etc.
  "amount" integer NOT NULL,     -- Number of units used
  "cost_cents" integer NOT NULL, -- What we charge them
  "our_cost_cents" integer,      -- Our actual cost (for margin tracking)
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "billed" boolean DEFAULT false,-- Has this been included in an invoice?
  "billed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "overage_charges" 
ADD CONSTRAINT "overage_charges_organization_id_fk" 
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "overage_charges_org_idx" ON "overage_charges"("organization_id");
CREATE INDEX IF NOT EXISTS "overage_charges_created_idx" ON "overage_charges"("created_at");
CREATE INDEX IF NOT EXISTS "overage_charges_billed_idx" ON "overage_charges"("billed") WHERE billed = false;
CREATE INDEX IF NOT EXISTS "overage_charges_resource_idx" ON "overage_charges"("resource_type");

-- RLS Policies
ALTER TABLE "overage_charges" ENABLE ROW LEVEL SECURITY;

-- Users can view their org's charges
CREATE POLICY "Users can view own org overage charges" ON "overage_charges"
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Only service role can insert/update (backend only)
CREATE POLICY "Service role can manage overage charges" ON "overage_charges"
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get total unbilled overages for an org
CREATE OR REPLACE FUNCTION get_unbilled_overages(org_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(SUM(cost_cents), 0)::integer
  FROM overage_charges
  WHERE organization_id = org_id AND billed = false;
$$ LANGUAGE sql STABLE;

-- Function to mark overages as billed
CREATE OR REPLACE FUNCTION mark_overages_billed(org_id uuid)
RETURNS void AS $$
  UPDATE overage_charges
  SET billed = true, billed_at = now()
  WHERE organization_id = org_id AND billed = false;
$$ LANGUAGE sql;

-- Function to get overage summary for current period
CREATE OR REPLACE FUNCTION get_overage_summary(org_id uuid, period_start timestamp, period_end timestamp)
RETURNS TABLE (
  resource_type text,
  total_amount integer,
  total_cost_cents integer,
  total_our_cost_cents integer,
  charge_count integer
) AS $$
  SELECT 
    resource_type,
    SUM(amount)::integer as total_amount,
    SUM(cost_cents)::integer as total_cost_cents,
    SUM(COALESCE(our_cost_cents, 0))::integer as total_our_cost_cents,
    COUNT(*)::integer as charge_count
  FROM overage_charges
  WHERE 
    organization_id = org_id 
    AND created_at >= period_start 
    AND created_at < period_end
  GROUP BY resource_type;
$$ LANGUAGE sql STABLE;

-- ============================================
-- DONE
-- ============================================
COMMENT ON TABLE overage_charges IS 'Tracks all pay-as-you-go overage charges for billing';

