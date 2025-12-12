-- ============================================
-- Notifications Table
-- Run this after the main schema
-- ============================================

-- Create notification type enum
CREATE TYPE "public"."notification_type" AS ENUM('info', 'success', 'warning', 'error');
CREATE TYPE "public"."notification_category" AS ENUM('audit', 'content', 'keyword', 'ranking', 'billing', 'system');

-- Create notifications table
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "type" "notification_type" DEFAULT 'info' NOT NULL,
  "category" "notification_category" DEFAULT 'system' NOT NULL,
  "read" boolean DEFAULT false NOT NULL,
  "action_url" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Create indexes
CREATE INDEX "notifications_user_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX "notifications_created_idx" ON "notifications"("created_at");
CREATE INDEX "notifications_category_idx" ON "notifications"("category");

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications 
  FOR DELETE USING (user_id = auth.uid());

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications 
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- ============================================
-- DONE! Notifications table is ready.
-- ============================================

