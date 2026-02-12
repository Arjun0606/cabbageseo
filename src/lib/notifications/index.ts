/**
 * In-App Notifications System
 *
 * Handles creating, fetching, and managing notifications for users.
 * Categories aligned with CabbageSEO's GEO features.
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
  | "visibility"   // Scan results, score changes
  | "content"      // Fix pages generated, ready
  | "citation"     // New citation found, citation lost
  | "audit"        // GEO audit complete
  | "billing"      // Usage alerts, plan changes
  | "system";      // General system notifications

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

      if (options.unreadOnly) query = query.eq("read", false);
      if (options.category) query = query.eq("category", options.category);
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) {
        console.error("[Notifications] Fetch error:", error);
        return [];
      }

      return ((data || []) as Array<{
        id: string; user_id: string; title: string; description: string;
        type: NotificationType; category: NotificationCategory;
        read: boolean; action_url?: string; metadata?: Record<string, unknown>; created_at: string;
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

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createServiceClient();
    if (!supabase) return 0;

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(notificationIds: string | string[]): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as never)
        .in("id", ids);
      return !error;
    } catch {
      return false;
    }
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as never)
        .eq("user_id", userId)
        .eq("read", false);
      return !error;
    } catch {
      return false;
    }
  },

  async delete(notificationId: string): Promise<boolean> {
    const supabase = createServiceClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);
      return !error;
    } catch {
      return false;
    }
  },

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

      if (error) return 0;
      return (data || []).length;
    } catch {
      return 0;
    }
  },

  async sendEmailNotification(input: CreateNotificationInput): Promise<void> {
    if (!input.emailTo || !emailService.isConfigured()) return;

    switch (input.category) {
      case "audit":
        if (input.metadata?.siteDomain && input.metadata?.score !== undefined) {
          await emailService.sendAuditComplete(
            input.emailTo,
            input.metadata.siteDomain as string,
            input.metadata.score as number,
            (input.metadata.tipsCount as number) || 0
          );
        }
        break;

      case "content":
        if (input.metadata?.pageId && input.metadata?.title) {
          await emailService.sendContentReady(
            input.emailTo,
            input.metadata.title as string,
            input.metadata.pageId as string
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

      case "visibility":
        if (input.metadata?.previousScore !== undefined && input.metadata?.newScore !== undefined) {
          await emailService.sendVisibilityDrop(
            input.emailTo,
            input.metadata.siteDomain as string,
            input.metadata.previousScore as number,
            input.metadata.newScore as number,
            (input.metadata.lostQueries as string[]) || []
          );
        }
        break;

      default:
        break;
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function notifyAuditComplete(
  userId: string, email: string, siteDomain: string, score: number, tipsCount: number
): Promise<void> {
  await notificationService.create({
    userId,
    title: "GEO Audit Complete",
    description: `${siteDomain} scored ${score}/100 with ${tipsCount} improvement tips`,
    type: score >= 60 ? "success" : score >= 40 ? "warning" : "error",
    category: "audit",
    actionUrl: "/dashboard/audit",
    metadata: { siteDomain, score, tipsCount },
    sendEmail: true,
    emailTo: email,
  });
}

export async function notifyContentReady(
  userId: string, email: string, title: string, pageId: string
): Promise<void> {
  await notificationService.create({
    userId,
    title: "Fix Page Ready",
    description: `"${title}" is ready for review and publishing`,
    type: "success",
    category: "content",
    actionUrl: `/dashboard/pages/${pageId}`,
    metadata: { title, pageId },
    sendEmail: true,
    emailTo: email,
  });
}

export async function notifyCitationFound(
  userId: string, siteDomain: string, platform: string, query: string
): Promise<void> {
  const platformName: Record<string, string> = {
    perplexity: "Perplexity AI",
    chatgpt: "ChatGPT",
    google_aio: "Google AI Overview",
  };
  const pName = platformName[platform] || platform;

  await notificationService.create({
    userId,
    title: `Cited by ${pName}`,
    description: `${siteDomain} was mentioned for "${query.slice(0, 80)}${query.length > 80 ? "..." : ""}"`,
    type: "success",
    category: "citation",
    actionUrl: "/dashboard",
    metadata: { siteDomain, platform, query },
  });
}

export async function notifyVisibilityDrop(
  userId: string, email: string, siteDomain: string,
  previousScore: number, newScore: number, lostQueries: string[]
): Promise<void> {
  const drop = previousScore - newScore;

  await notificationService.create({
    userId,
    title: "Visibility Drop",
    description: `${siteDomain} lost ${drop} quer${drop === 1 ? "y" : "ies"} (${previousScore} → ${newScore})`,
    type: drop >= 3 ? "error" : "warning",
    category: "visibility",
    actionUrl: "/dashboard/pages",
    metadata: { siteDomain, previousScore, newScore, lostQueries },
    sendEmail: drop >= 2,
    emailTo: email,
  });
}

export async function notifyUsageWarning(
  userId: string, email: string, metric: string, used: number, limit: number
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
