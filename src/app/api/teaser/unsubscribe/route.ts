/**
 * Teaser Score Alert Unsubscribe
 *
 * One-click unsubscribe from weekly rescan emails.
 * GET /api/teaser/unsubscribe?email=X&domain=Y
 */

import { db, teaserSubscribers } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const domain = searchParams.get("domain");

  if (!email || !domain) {
    return new Response("Missing parameters", { status: 400 });
  }

  // Sanitize domain to prevent XSS in HTML response
  const safeDomain = domain
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  try {
    await db
      .update(teaserSubscribers)
      .set({ unsubscribed: true })
      .where(
        and(
          eq(teaserSubscribers.email, email.toLowerCase().trim()),
          eq(teaserSubscribers.domain, domain.toLowerCase().trim()),
        ),
      );
  } catch {
    // Non-fatal — still show success page
  }

  // Return a simple HTML page
  return new Response(
    `<!DOCTYPE html>
<html>
<head><title>Unsubscribed — CabbageSEO</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: system-ui, sans-serif; background: #09090b; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
  <div style="text-align: center; max-width: 400px;">
    <h1 style="font-size: 24px; margin-bottom: 8px;">Unsubscribed</h1>
    <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">
      You won't receive weekly score updates for ${safeDomain} anymore.
    </p>
    <a href="/" style="color: #10b981; font-size: 14px; text-decoration: none;">← Back to CabbageSEO</a>
  </div>
</body>
</html>`,
    {
      headers: { "Content-Type": "text/html" },
    },
  );
}
