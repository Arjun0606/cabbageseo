/**
 * Admin Reset Endpoint
 * Clears test data to allow a fresh start
 * Only works when TESTING_MODE is enabled
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const TESTING_MODE = process.env.TESTING_MODE === "true";

export async function POST(request: NextRequest) {
  // Only allow in testing mode
  if (!TESTING_MODE) {
    return NextResponse.json(
      { error: "This endpoint is only available in testing mode" },
      { status: 403 }
    );
  }

  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch (error) {
    console.error("[Admin Reset] Service client error:", error);
    return NextResponse.json(
      { error: "Service client not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { domain, clearAll } = body;

    const deleted = {
      issues: 0,
      audits: 0,
      content: 0,
      keywords: 0,
      sites: 0,
    };

    if (clearAll) {
      // Clear all test data from all organizations
      const { data: orgs } = await serviceClient
        .from("organizations")
        .select("id")
        .limit(10);

      if (orgs && orgs.length > 0) {
        const typedOrgs = orgs as { id: string }[];
        const orgIds = typedOrgs.map((o) => o.id);

        // Get all sites for these orgs
        const { data: sites } = await serviceClient
          .from("sites")
          .select("id")
          .in("organization_id", orgIds);

        if (sites && sites.length > 0) {
          const typedSites = sites as { id: string }[];
          const siteIds = typedSites.map((s) => s.id);

          // Delete issues
          await serviceClient.from("issues").delete().in("site_id", siteIds);
          deleted.issues = siteIds.length; // Approximate

          // Delete audits
          await serviceClient.from("audits").delete().in("site_id", siteIds);
          deleted.audits = siteIds.length;

          // Delete content
          await serviceClient.from("content").delete().in("site_id", siteIds);
          deleted.content = siteIds.length;

          // Delete keywords
          await serviceClient.from("keywords").delete().in("site_id", siteIds);
          deleted.keywords = siteIds.length;

          // Delete sites
          await serviceClient.from("sites").delete().in("id", siteIds);
          deleted.sites = siteIds.length;
        }
      }
    } else if (domain) {
      // Clear specific domain
      const normalizedDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/+$/, "")
        .toLowerCase();

      // Find site(s) with this domain
      const { data: sites } = await serviceClient
        .from("sites")
        .select("id")
        .ilike("domain", `%${normalizedDomain}%`);

      if (sites && sites.length > 0) {
        const typedSites = sites as { id: string }[];
        const siteIds = typedSites.map((s) => s.id);

        // Delete issues
        await serviceClient.from("issues").delete().in("site_id", siteIds);
        deleted.issues = siteIds.length;

        // Delete audits
        await serviceClient.from("audits").delete().in("site_id", siteIds);
        deleted.audits = siteIds.length;

        // Delete content
        await serviceClient.from("content").delete().in("site_id", siteIds);
        deleted.content = siteIds.length;

        // Delete keywords
        await serviceClient.from("keywords").delete().in("site_id", siteIds);
        deleted.keywords = siteIds.length;

        // Delete sites
        await serviceClient.from("sites").delete().in("id", siteIds);
        deleted.sites = siteIds.length;
      }
    } else {
      return NextResponse.json(
        { error: "Provide 'domain' or set 'clearAll: true'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Data cleared successfully",
      deleted,
    });
  } catch (error) {
    console.error("[Admin Reset] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset data" },
      { status: 500 }
    );
  }
}
