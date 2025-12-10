-- ============================================
-- INTEGRATIONS TABLE
-- Stores encrypted API credentials for all integrations
-- ============================================

-- Create integrations table if not exists
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
    error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one integration type per organization
    UNIQUE(organization_id, type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integrations_updated_at ON integrations;
CREATE TRIGGER trigger_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- RLS Policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see integrations for their organization
CREATE POLICY integrations_select_policy ON integrations
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can only insert integrations for their organization
CREATE POLICY integrations_insert_policy ON integrations
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can only update integrations for their organization
CREATE POLICY integrations_update_policy ON integrations
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can only delete integrations for their organization
CREATE POLICY integrations_delete_policy ON integrations
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================
-- CONTENT TABLE (for CMS publishing)
-- Stores generated content ready for publishing
-- ============================================

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500),
    content TEXT,
    excerpt TEXT,
    seo_title VARCHAR(70),
    meta_description VARCHAR(160),
    focus_keyword VARCHAR(100),
    categories TEXT[],
    tags TEXT[],
    featured_image TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'published', 'failed')),
    published_url TEXT,
    published_at TIMESTAMPTZ,
    cms_post_id VARCHAR(100),
    publish_error TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_org_id ON content(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_site_id ON content(site_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);

-- Update trigger
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_content_updated_at ON content;
CREATE TRIGGER trigger_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_select_policy ON content
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY content_insert_policy ON content
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY content_update_policy ON content
    FOR UPDATE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY content_delete_policy ON content
    FOR DELETE
    USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

