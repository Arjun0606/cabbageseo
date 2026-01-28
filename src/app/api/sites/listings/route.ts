/**
 * /api/sites/listings - Get trust source listings for a site
 * 
 * Reads from source_listings table which is populated when running checks.
 * Shows which trust sources (G2, Capterra, Reddit, etc.) the site is listed on.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getTestSession } from "@/lib/testing/test-session";
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

    // Check for bypass user first
    const bypassUser = await getUser();
    const testSession = await getTestSession();
    let organizationId: string | null = null;

    if (bypassUser?.isTestAccount && bypassUser.id.startsWith("test-bypass")) {
      // Bypass mode - return empty listings
      return NextResponse.json({
        listings: TRUST_SOURCE_DOMAINS.map(source => ({
          sourceDomain: source.domain,
          sourceName: source.name,
          isListed: false,
          listingUrl: null,
          lastChecked: new Date().toISOString(),
        })),
        bypassMode: true,
      });
    } else if (testSession) {
      organizationId = testSession.organizationId ?? null;
    } else {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Get user's org
      const db = createServiceClient();
      const { data: userData } = await db
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const userRecord = userData as { organization_id: string | null } | null;
      organizationId = userRecord?.organization_id || null;
    }

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
