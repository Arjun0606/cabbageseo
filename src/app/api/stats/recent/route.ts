/**
 * Recent Scans API
 *
 * Returns the 10 most recent teaser scans with anonymized domains.
 * Used for social proof ticker on the homepage.
 *
 * GET /api/stats/recent → { scans: Array<{ domain: string; timeAgo: string }> }
 */

import { db, teaserReports } from "@/lib/db";
import { desc } from "drizzle-orm";

function anonymize(domain: string): string {
  const parts = domain.split(".");
  const name = parts[0];
  const tld = parts.slice(1).join(".");
  const visible = name.slice(0, 3);
  return `${visible}***.${tld || "com"}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET() {
  try {
    const recent = await db
      .select({
        domain: teaserReports.domain,
        createdAt: teaserReports.createdAt,
      })
      .from(teaserReports)
      .orderBy(desc(teaserReports.createdAt))
      .limit(10);

    const scans = recent.map((r) => ({
      domain: anonymize(r.domain),
      timeAgo: timeAgo(new Date(r.createdAt)),
    }));

    return Response.json(
      { scans },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, max-age=30",
        },
      },
    );
  } catch {
    return Response.json({ scans: [] });
  }
}
