/**
 * Teaser Score Alert Subscription
 *
 * Saves email + domain for weekly rescan notifications.
 * Public endpoint — no auth required.
 *
 * POST /api/teaser/subscribe
 * Body: { email, domain, reportId? }
 */

import { db, teaserSubscribers } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { authLimiter } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit by IP (public endpoint)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = authLimiter.check(ip);
    if (!rateLimit.allowed) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email, domain, reportId } = body;

    if (!email || !domain) {
      return Response.json({ error: "Email and domain are required" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Check if already subscribed (same email + domain)
    const [existing] = await db
      .select({ id: teaserSubscribers.id })
      .from(teaserSubscribers)
      .where(
        and(
          eq(teaserSubscribers.email, email.toLowerCase().trim()),
          eq(teaserSubscribers.domain, domain.toLowerCase().trim()),
        ),
      )
      .limit(1);

    if (existing) {
      // Re-subscribe if previously unsubscribed
      await db
        .update(teaserSubscribers)
        .set({ unsubscribed: false })
        .where(eq(teaserSubscribers.id, existing.id));

      return Response.json({ success: true });
    }

    await db.insert(teaserSubscribers).values({
      email: email.toLowerCase().trim(),
      domain: domain.toLowerCase().trim(),
      reportId: reportId || null,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
