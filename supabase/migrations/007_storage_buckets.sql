-- ============================================
-- CabbageSEO Storage Buckets
-- Run this in Supabase SQL Editor AFTER the main schema
-- ============================================

-- ============================================
-- 1. EXPORTS BUCKET
-- For downloadable content and reports
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false, -- Private, requires auth
  52428800, -- 50MB max
  ARRAY['text/html', 'text/markdown', 'text/plain', 'text/csv', 'application/json', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Users can view/download their org's exports
CREATE POLICY "Users can view own org exports" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Users can create exports for their org
CREATE POLICY "Users can create own org exports" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their org's exports
CREATE POLICY "Users can delete own org exports" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 2. UPLOADS BUCKET
-- For user file uploads (keyword CSVs, etc.)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  10485760, -- 10MB max
  ARRAY['text/csv', 'text/plain', 'application/json', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Users can view their org's uploads
CREATE POLICY "Users can view own org uploads" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Users can upload to their org
CREATE POLICY "Users can create own org uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their org's uploads
CREATE POLICY "Users can delete own org uploads" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 3. CONTENT-IMAGES BUCKET
-- For article images, featured images
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true, -- Public so images can be embedded in published content
  5242880, -- 5MB max per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Anyone can view content images (they're public for embedding)
CREATE POLICY "Public can view content images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'content-images');

-- Users can upload images for their org
CREATE POLICY "Users can upload content images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'content-images' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Users can delete their org's images
CREATE POLICY "Users can delete own content images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'content-images' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 4. SCREENSHOTS BUCKET
-- For audit page screenshots
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  false,
  2097152, -- 2MB max per screenshot
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Users can view their org's screenshots
CREATE POLICY "Users can view own org screenshots" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'screenshots' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Service role can create screenshots (from audit jobs)
CREATE POLICY "Service can create screenshots" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'screenshots');

-- Users can delete their org's screenshots
CREATE POLICY "Users can delete own screenshots" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'screenshots' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 5. SITEMAPS BUCKET
-- For cached sitemap files
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sitemaps',
  'sitemaps',
  false,
  10485760, -- 10MB max (sitemaps can be large)
  ARRAY['application/xml', 'text/xml', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Users can view their org's sitemaps
CREATE POLICY "Users can view own org sitemaps" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'sitemaps' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM users WHERE id = auth.uid()
    )
  );

-- Service role can create sitemaps
CREATE POLICY "Service can create sitemaps" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'sitemaps');

-- ============================================
-- GRANT SERVICE ROLE FULL ACCESS
-- ============================================

-- Service role needs full access for background jobs
CREATE POLICY "Service role full access exports" ON storage.objects
  FOR ALL
  USING (bucket_id = 'exports' AND auth.role() = 'service_role');

CREATE POLICY "Service role full access uploads" ON storage.objects
  FOR ALL
  USING (bucket_id = 'uploads' AND auth.role() = 'service_role');

CREATE POLICY "Service role full access content-images" ON storage.objects
  FOR ALL
  USING (bucket_id = 'content-images' AND auth.role() = 'service_role');

CREATE POLICY "Service role full access screenshots" ON storage.objects
  FOR ALL
  USING (bucket_id = 'screenshots' AND auth.role() = 'service_role');

CREATE POLICY "Service role full access sitemaps" ON storage.objects
  FOR ALL
  USING (bucket_id = 'sitemaps' AND auth.role() = 'service_role');

-- ============================================
-- DONE! Storage buckets are ready.
-- ============================================

-- Folder structure for each bucket:
-- exports/{org_id}/articles/{filename}
-- exports/{org_id}/reports/{filename}
-- exports/{org_id}/keywords/{filename}
-- 
-- uploads/{org_id}/keywords/{filename}
-- uploads/{org_id}/competitors/{filename}
-- 
-- content-images/{org_id}/{site_id}/{content_id}/{filename}
-- 
-- screenshots/{org_id}/{site_id}/{page_id}/{filename}
-- 
-- sitemaps/{org_id}/{site_id}/{filename}

