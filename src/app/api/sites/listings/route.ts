/**
 * /api/sites/listings - Get trust source listings for a site
 * 
 * Reads from source_listings table which is populated when running checks.
 * Shows which trust sources (G2, Capterra, Reddit, etc.) the site is listed on.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/api/get-user";

// Known trust sources that AI platforms use
const TRUST_SOURCE_DOMAINS = [
  { domain: "g2.com", name: "G2" },
  { domain: "capterra.com", name: "Capterra" },
  { domain: "producthunt.com", name: "Product Hunt" },
  { domain: "reddit.com", name: "Reddit" },
  { domain: "trustpilot.com", name: "Trustpilot" },
  { domain: "trustradius.com", name: "TrustRadius" },
  { domain: "alternativeto.net", name: "AlternativeTo" },
  { domain: "news.ycombinator.com", name: "Hacker News" },
  { domain: "indiehackers.com", name: "Indie Hackers" },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = currentUser.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    // Use service client for queries
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

    // Get stored listings from source_listings table
    const { data: storedListingsRaw } = await db
      .from("source_listings")
      .select("source_domain, source_name, profile_url, status, verified_at")
      .eq("site_id", siteId);

    // Type the listings properly
    type ListingRecord = {
      source_domain: string;
      source_name: string;
      profile_url: string | null;
      status: string;
      verified_at: string | null;
    };
    
    const storedListings = storedListingsRaw as ListingRecord[] | null;

    // Create a map of stored listings
    const listingsMap = new Map<string, ListingRecord>();

    if (storedListings) {
      for (const listing of storedListings) {
        listingsMap.set(listing.source_domain, listing);
      }
    }

    // Build listings array with all known sources
    const listings = TRUST_SOURCE_DOMAINS.map(source => {
      const stored = listingsMap.get(source.domain);
      
      return {
        source_domain: source.domain,
        source_name: stored?.source_name || source.name,
        profile_url: stored?.profile_url || null,
        status: stored?.status || "not_checked",
        verified_at: stored?.verified_at || null,
      };
    });

    // Count stats
    const verifiedCount = listings.filter(l => l.status === "verified").length;
    const unverifiedCount = listings.filter(l => l.status === "unverified").length;
    const notCheckedCount = listings.filter(l => l.status === "not_checked").length;

    return NextResponse.json({
      listings,
      totalSources: TRUST_SOURCE_DOMAINS.length,
      listedCount: verifiedCount,
      missingCount: unverifiedCount,
      notCheckedCount,
      message: notCheckedCount > 0 
        ? "Run a check to verify your listings on trust sources" 
        : undefined,
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

    // Auth check
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
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", organizationId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check if listing already exists
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
