/**
 * Scan Counter API
 *
 * Returns total number of teaser reports (domains scanned).
 * Used for social proof on the home page.
 *
 * GET /api/stats/scans → { count: number }
 */

import { db, teaserReports } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teaserReports);

    return Response.json(
      { count: result.count },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, max-age=60",
        },
      },
    );
  } catch {
    return Response.json({ count: 0 });
  }
}
