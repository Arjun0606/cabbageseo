/**
 * In-App Notifications System
 * 
 * Handles creating, fetching, and managing notifications for users.
 * Integrates with email service for important notifications.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { emailService } from "@/lib/email";

// ============================================
// TYPES
// ============================================

export type NotificationType = 
  | "info" 
  | "success" 
  | "warning" 
  | "error";

export type NotificationCategory = 
  | "audit"
  | "content" 
  | "keyword"
  | "ranking"
  | "billing"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  emailTo?: string;
}

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

export const notificationService = {
  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const supabase = createServiceClient();
    if (!supabase) {
      console.error("[Notifications] Database not configured");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: input.userId,
          title: input.title,
          description: input.description,
          type: input.type,
          category: input.category,
          action_url: input.actionUrl,
          metadata: input.metadata || {},
          read: false,
        } as never)
        .select()
        .single();

      if (error) {
        console.error("[Notifications] Create error:", error);
        return null;
      }

      const notification = data as {
        id: string;
        user_id: string;
        title: string;
        description: string;
        type: NotificationType;
        category: NotificationCategory;
        read: boolean;
        action_url?: string;
        metadata?: Record<string, unknown>;
        created_at: string;
      };

      // Send email if requested
      if (input.sendEmail && input.emailTo) {
        await this.sendEmailNotification(input);
      }

      return {
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        description: notification.description,
        type: notification.type,
        category: notification.category,
        read: notification.read,
        actionUrl: notification.action_url,
        metadata: notification.metadata,
        createdAt: notification.created_at,
      };
    } catch (error) {
      console.error("[Notifications] Exception:", error);
      return null;
    }
  },

  /**
   * Get notifications for a user
   */
  async getForUser(
    userId: string, 
    options: { 
      limit?: number; 
      unreadOnly?: boolean;
      category?: NotificationCategory;
    } = {}
  ): Promise<Notification[]> {
    const supabase = createServiceClient();
    if (!supabase) return [];

    try {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (options.unreadOnly) {
        query = query.eq("read", false);
      }

      if (options.category) {
        query = query.eq("category", options.category);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Notifications] Fetch error:", error);
        return [];
      }

      return ((data || []) as Array<{
        id: string;
        user_id: string;
        title: string;
        description: string;
        type: NotificationType;
        category: NotificationCategory;
        read: boolean;
        action_url?: string;
        metadata?: Record<string, unknown>;
        created_at: string;
      }>).map(n => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        description: n.description,
        type: n.type,
        category: n.category,
        read: n.read,
        actionUrl: n.action_url,
        metadata: n.metadata,
        createdAt: n.created_at,
      }));
    } catch (error) {
      console.error("[Notifications] Exception:", error);
      return [];
    }
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createServiceClient();
    if (!supabase) return 0;

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("[Notifications] Count error:", error);
        return 0;
      }

      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark notification(s) as read
   */
  async markAsRead(notificationIds: string | string[]): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as never)
        .in("id", ids);

      if (error) {
        console.error("[Notifications] Mark read error:", error);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as never)
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("[Notifications] Mark all read error:", error);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async delete(notificationId: string): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("[Notifications] Delete error:", error);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOld(daysOld: number = 30): Promise<number> {
    const supabase = createServiceClient();
    if (!supabase) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .eq("read", true)
        .select("id");

      if (error) {
        console.error("[Notifications] Cleanup error:", error);
        return 0;
      }

      return (data || []).length;
    } catch {
      return 0;
    }
  },

  /**
   * Send email notification based on category
   */
  async sendEmailNotification(input: CreateNotificationInput): Promise<void> {
    if (!input.emailTo || !emailService.isConfigured()) return;

    switch (input.category) {
      case "audit":
        if (input.metadata?.siteDomain && input.metadata?.score !== undefined) {
          await emailService.sendAuditComplete(
            input.emailTo,
            input.metadata.siteDomain as string,
            input.metadata.score as number,
            (input.metadata.issuesCount as number) || 0
          );
        }
        break;

      case "content":
        if (input.metadata?.contentId && input.metadata?.title) {
          await emailService.sendContentReady(
            input.emailTo,
            input.metadata.title as string,
            input.metadata.contentId as string
          );
        }
        break;

      case "billing":
        if (input.metadata?.metric && input.metadata?.used !== undefined) {
          await emailService.sendUsageAlert(
            input.emailTo,
            input.metadata.metric as string,
            input.metadata.used as number,
            input.metadata.limit as number
          );
        }
        break;

      default:
        // No specific email template for this category
        break;
    }
  },
};

// ============================================
// HELPER FUNCTIONS FOR COMMON NOTIFICATIONS
// ============================================

export async function notifyAuditComplete(
  userId: string,
  email: string,
  siteDomain: string,
  score: number,
  issuesCount: number
): Promise<void> {
  await notificationService.create({
    userId,
    title: "Audit Complete",
    description: `${siteDomain} scored ${score}/100 with ${issuesCount} issues found`,
    type: score >= 80 ? "success" : score >= 60 ? "warning" : "error",
    category: "audit",
    actionUrl: "/audit",
    metadata: { siteDomain, score, issuesCount },
    sendEmail: true,
    emailTo: email,
  });
}

export async function notifyContentReady(
  userId: string,
  email: string,
  title: string,
  contentId: string
): Promise<void> {
  await notificationService.create({
    userId,
    title: "Content Ready",
    description: `"${title}" is ready for review`,
    type: "success",
    category: "content",
    actionUrl: `/content/${contentId}`,
    metadata: { title, contentId },
    sendEmail: true,
    emailTo: email,
  });
}

export async function notifyRankingChange(
  userId: string,
  keyword: string,
  oldPosition: number,
  newPosition: number
): Promise<void> {
  const change = oldPosition - newPosition;
  const improved = change > 0;

  await notificationService.create({
    userId,
    title: improved ? "Ranking Improved! 🎉" : "Ranking Dropped",
    description: `"${keyword}" ${improved ? "gained" : "lost"} ${Math.abs(change)} positions (now #${newPosition})`,
    type: improved ? "success" : "warning",
    category: "ranking",
    actionUrl: "/keywords",
    metadata: { keyword, oldPosition, newPosition, change },
  });
}

export async function notifyUsageWarning(
  userId: string,
  email: string,
  metric: string,
  used: number,
  limit: number
): Promise<void> {
  const percentage = Math.round((used / limit) * 100);
  
  await notificationService.create({
    userId,
    title: "Usage Alert",
    description: `${metric} is at ${percentage}% (${used}/${limit})`,
    type: percentage >= 100 ? "error" : "warning",
    category: "billing",
    actionUrl: "/settings/billing",
    metadata: { metric, used, limit, percentage },
    sendEmail: percentage >= 90,
    emailTo: email,
  });
}

export default notificationService;

