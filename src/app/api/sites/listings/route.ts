/**
 * /api/sites/listings — Trust source listings for a site.
 *
 * GET: Returns trust sources relevant to this site (from AI selection during
 *      scans) merged with stored listing status. Includes how-to-get-listed
 *      info from the master catalog.
 *
 * POST: Mark a source as listed (user confirms they're on it).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";
import {
  TRUST_SOURCES,
  selectRelevantTrustSources,
  type TrustSource,
} from "@/lib/ai-revenue/sources";
import { fetchSiteContext } from "@/lib/geo/site-context";

type ListingRecord = {
  source_domain: string;
  source_name: string;
  profile_url: string | null;
  status: string;
  verified_at: string | null;
};

/**
 * Enrich a source domain with full catalog info.
 */
function enrichSource(domain: string): TrustSource | null {
  return TRUST_SOURCES.find(s => s.domain === domain) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = createServiceClient();

    // Verify site belongs to this org
    const { data: site } = await db
      .from("sites")
      .select("id, domain")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get all stored listings for this site
    const { data: storedListingsRaw } = await db
      .from("source_listings")
      .select("source_domain, source_name, profile_url, status, verified_at")
      .eq("site_id", siteId);

    const storedListings = (storedListingsRaw as ListingRecord[] | null) || [];
    const listingsMap = new Map<string, ListingRecord>();
    for (const listing of storedListings) {
      listingsMap.set(listing.source_domain, listing);
    }

    // Select relevant trust sources using AI + actual site context
    let relevantSources: TrustSource[];
    try {
      const siteCtx = await fetchSiteContext(site.domain);
      relevantSources = await selectRelevantTrustSources(site.domain, siteCtx);
    } catch {
      // Fallback to high-trust sources
      relevantSources = TRUST_SOURCES
        .filter(s => s.trustScore >= 8)
        .slice(0, 6);
    }

    // Merge: relevant sources + any additional stored listings not in the relevant set
    const relevantDomains = new Set(relevantSources.map(s => s.domain));
    const extraStored = storedListings
      .filter(l => !relevantDomains.has(l.source_domain))
      .map(l => enrichSource(l.source_domain))
      .filter((s): s is TrustSource => s !== null);

    const allSources = [...relevantSources, ...extraStored];

    // Build response
    const listings = allSources.map(source => {
      const stored = listingsMap.get(source.domain);
      return {
        source_domain: source.domain,
        source_name: source.name,
        category: source.category,
        trust_score: source.trustScore,
        how_to_get_listed: source.howToGetListed,
        estimated_effort: source.estimatedEffort,
        estimated_time: source.estimatedTime,
        profile_url: stored?.profile_url || null,
        status: stored?.status || "not_checked",
        verified_at: stored?.verified_at || null,
      };
    });

    const verifiedCount = listings.filter(l => l.status === "verified").length;
    const notListedCount = listings.filter(l => l.status === "not_checked" || l.status === "unverified").length;

    return NextResponse.json({
      listings,
      totalSources: listings.length,
      listedCount: verifiedCount,
      missingCount: notListedCount,
    });
  } catch (error) {
    console.error("[Sites Listings] Error:", error);
    return NextResponse.json({ error: "Failed to get listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteId, sourceDomain, sourceName, status } = body;

    if (!siteId || !sourceDomain || !sourceName) {
      return NextResponse.json(
        { error: "siteId, sourceDomain, and sourceName are required" },
        { status: 400 }
      );
    }

    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const db = createServiceClient();

    const { data: site } = await db
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const { data: existing } = await (db
      .from("source_listings")
      .select("id")
      .eq("site_id", siteId)
      .eq("source_domain", sourceDomain)
      .maybeSingle() as any) as { data: { id: string } | null };

    const resolvedStatus = status || "verified";
    const now = new Date().toISOString();

    if (existing) {
      await (db.from("source_listings") as any).update({
        status: resolvedStatus,
        verified_at: now,
        updated_at: now,
      }).eq("id", existing.id);
    } else {
      await (db.from("source_listings") as any).insert({
        site_id: siteId,
        source_domain: sourceDomain,
        source_name: sourceName,
        status: resolvedStatus,
        verified_at: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sites Listings] POST error:", error);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
