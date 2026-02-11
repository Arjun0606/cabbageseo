-- ============================================
-- Migration: Page Auto-Refresh Tracking
-- February 2026
-- ============================================
-- Adds refresh tracking columns to generated_pages
-- for the auto-refresh cron job (daily at 6 AM UTC).
-- Safe to run on existing databases (uses IF NOT EXISTS).
-- ============================================

-- Add refresh tracking columns
ALTER TABLE generated_pages
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refresh_count INTEGER NOT NULL DEFAULT 0;

-- Add partial index for efficient stale-page queries in the cron job
CREATE INDEX IF NOT EXISTS generated_pages_refresh_idx
  ON generated_pages(status, last_refreshed_at)
  WHERE status = 'published';
