/**
 * /api/sites/listings - Manage source listings for AI Impact Tracking
 * 
 * GET - Get all listings for a site
 * POST - Add a new listing (mark as listed on a source)
 * DELETE - Remove a listing
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TRUST_SOURCES } from "@/lib/ai-revenue/sources";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteId = request.nextUrl.searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    // Get listings for this site
    const { data: listingsData, error } = await supabase
      .from("source_listings")
      .select("*")
      .eq("site_id", siteId)
      .order("listed_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listings = (listingsData || []) as any[];

    // Get all trust sources with listing status
    const sourcesWithStatus = TRUST_SOURCES.map(source => {
      const listing = listings.find(l => l.source_domain === source.domain);
      return {
        ...source,
        isListed: !!listing,
        listing: listing ? {
          id: listing.id,
          listedAt: listing.listed_at,
          verifiedAt: listing.verified_at,
          profileUrl: listing.profile_url,
          status: listing.status,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      listings: listings,
      sourcesWithStatus,
      stats: {
        totalSources: TRUST_SOURCES.length,
        listed: listings.length,
        notListed: TRUST_SOURCES.length - listings.length,
      },
    });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, sourceDomain, profileUrl } = body;

    if (!siteId || !sourceDomain) {
      return NextResponse.json({ error: "siteId and sourceDomain required" }, { status: 400 });
    }

    // Find the source
    const source = TRUST_SOURCES.find(s => s.domain === sourceDomain);
    if (!source) {
      return NextResponse.json({ error: "Unknown source" }, { status: 400 });
    }

    // Verify site ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", siteId)
      .eq("organization_id", (profile as { organization_id: string }).organization_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Create or update listing
    const { data: listing, error } = await supabase
      .from("source_listings")
      .upsert({
        site_id: siteId,
        source_domain: sourceDomain,
        source_name: source.name,
        profile_url: profileUrl || null,
        status: "pending",
        listed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: "site_id,source_domain",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listing,
      message: `Marked as listed on ${source.name}. We'll track your AI mentions from this source.`,
    });
  } catch (error) {
    console.error("Listings POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get("id");
    if (!listingId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Delete listing (cascades are handled by DB)
    const { error } = await supabase
      .from("source_listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      console.error("Error deleting listing:", error);
      return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Listing removed",
    });
  } catch (error) {
    console.error("Listings DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

