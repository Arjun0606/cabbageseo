/**
 * Recent Scans API
 *
 * Returns the 10 most recent teaser scans with anonymized domains.
 * Used for social proof ticker on the homepage.
 *
 * GET /api/stats/recent → { scans: Array<{ domain: string; timeAgo: string }> }
 */

import { db, teaserReports } from "@/lib/db";
import { desc, sql } from "drizzle-orm";

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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [recent, countsRes] = await Promise.all([
      db
        .select({
          domain: teaserReports.domain,
          createdAt: teaserReports.createdAt,
        })
        .from(teaserReports)
        .orderBy(desc(teaserReports.createdAt))
        .limit(10),

      db
        .select({
          totalScans: sql<number>`COUNT(*)`.as("total_scans"),
          totalDomains: sql<number>`COUNT(DISTINCT ${teaserReports.domain})`.as("total_domains"),
          scansToday: sql<number>`COUNT(*) FILTER (WHERE ${teaserReports.createdAt} >= ${today.toISOString()})`.as("scans_today"),
        })
        .from(teaserReports),
    ]);

    const scans = recent.map((r) => ({
      domain: anonymize(r.domain),
      timeAgo: timeAgo(new Date(r.createdAt)),
    }));

    const raw = countsRes[0];
    const counts = {
      totalScans: Number(raw?.totalScans) || 0,
      totalDomains: Number(raw?.totalDomains) || 0,
      scansToday: Number(raw?.scansToday) || 0,
    };

    return Response.json(
      { scans, counts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, max-age=30",
        },
      },
    );
  } catch (error) {
    console.error("[/api/stats/recent] Error:", error);
    return Response.json({ scans: [], counts: { totalScans: 0, totalDomains: 0, scansToday: 0 } });
  }
}
