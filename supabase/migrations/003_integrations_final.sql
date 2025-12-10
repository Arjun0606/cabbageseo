-- ============================================
-- INTEGRATIONS TABLE FOR CABBAGESEO
-- Run this AFTER the main schema
-- ============================================

-- Create integration status enum
CREATE TYPE "public"."integration_status" AS ENUM('active', 'error', 'disconnected');

-- Create integrations table
CREATE TABLE "integrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "type" text NOT NULL,
    "credentials" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "status" "integration_status" DEFAULT 'active' NOT NULL,
    "error" text,
    "last_synced_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    
    -- One integration type per organization
    CONSTRAINT "integrations_org_type_unique" UNIQUE("organization_id", "type")
);

-- Foreign key to organizations
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_organizations_id_fk" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;

-- Indexes
CREATE INDEX "integrations_org_idx" ON "integrations" USING btree ("organization_id");
CREATE INDEX "integrations_type_idx" ON "integrations" USING btree ("type");
CREATE INDEX "integrations_status_idx" ON "integrations" USING btree ("status");

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_integrations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Select: Users can view integrations for their organization
CREATE POLICY "Users can view own org integrations" ON integrations
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Insert: Users can add integrations to their organization  
CREATE POLICY "Users can add integrations" ON integrations
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Update: Users can update integrations for their organization
CREATE POLICY "Users can update own org integrations" ON integrations
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Delete: Users can remove integrations from their organization
CREATE POLICY "Users can delete own org integrations" ON integrations
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- ============================================
-- SERVICE ROLE BYPASS (for API routes)
-- ============================================

-- Allow service role to bypass RLS (already default in Supabase)
-- This allows our API routes using service role key to work

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON integrations TO authenticated;
GRANT ALL ON integrations TO service_role;

