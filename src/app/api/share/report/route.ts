/**
 * Shareable Report API
 * 
 * Generates shareable links for AI visibility reports.
 * These links drive viral growth by letting users share wins.
 * 
 * Each shared report:
 * - Has a unique ID
 * - Shows "Powered by CabbageSEO"
 * - Links back to signup
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Generate a short unique ID
function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { siteId, reportType = "weekly" } = body;
    
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }
    
    // Verify site ownership
    const { data: profileData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    
    const profile = profileData as { organization_id: string } | null;
    
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }
    
    const { data: siteData } = await supabase
      .from("sites")
      .select("id, domain, total_citations, citations_this_week, geo_score_avg")
      .eq("id", siteId)
      .eq("organization_id", profile.organization_id)
      .single();
    
    const site = siteData as { 
      id: string; 
      domain: string; 
      total_citations: number | null; 
      citations_this_week: number | null; 
      geo_score_avg: number | null; 
    } | null;
    
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    
    // Generate share ID and URL
    const shareId = generateShareId();
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/share/${shareId}`;
    
    // For now, just return the share URL pointing to the public profile
    // The public profile already has sharing built-in
    const publicProfileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cabbageseo.com"}/ai-profile/${encodeURIComponent(site.domain)}`;
    
    return NextResponse.json({
      success: true,
      data: {
        shareId,
        shareUrl: publicProfileUrl,
        domain: site.domain,
        stats: {
          totalMentions: site.total_citations || 0,
          weeklyMentions: site.citations_this_week || 0,
          aiVisibility: site.geo_score_avg || 0,
        },
        // Social sharing templates
        templates: {
          twitter: `🚀 ${site.domain} is now being recommended by AI!\n\n📊 ${site.total_citations || 0} AI mentions\n📈 AI Visibility: ${site.geo_score_avg || 0}%\n\nTrack your AI visibility: ${publicProfileUrl}\n\n#AI #SEO #CabbageSEO`,
          linkedin: `Excited to share: ${site.domain} is being recommended by AI platforms like ChatGPT and Perplexity!\n\nWe've tracked ${site.total_citations || 0} AI mentions so far.\n\nSee our full AI visibility report: ${publicProfileUrl}`,
          copy: publicProfileUrl,
        },
      },
    });
  } catch (error) {
    console.error("[Share Report] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get share data by ID (for rendering shared reports)
  const shareId = request.nextUrl.searchParams.get("id");
  
  if (!shareId) {
    return NextResponse.json({ error: "Share ID required" }, { status: 400 });
  }
  
  // For now, redirect to the homepage with a note about the share
  // In production, you'd look up the share ID and render the report
  return NextResponse.json({
    success: true,
    message: "Use /ai-profile/[domain] for public profiles",
  });
}

