-- ============================================
-- Fix: Add missing foreign key for keywords.content_id
-- ============================================
-- The keywords table has a content_id column but was missing the 
-- foreign key constraint to the content table, which could cause
-- orphaned references and data integrity issues.

-- Add foreign key constraint with ON DELETE SET NULL
-- (setting to null when content is deleted, preserving keyword tracking)
ALTER TABLE "keywords" 
ADD CONSTRAINT "keywords_content_id_content_id_fk" 
FOREIGN KEY ("content_id") 
REFERENCES "content"("id") 
ON DELETE SET NULL;

-- Add index for performance on content_id lookups
CREATE INDEX IF NOT EXISTS "keywords_content_id_idx" ON "keywords" ("content_id");

