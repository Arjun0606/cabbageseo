/**
 * Integration Test API
 * 
 * Tests integration credentials before saving.
 * CabbageSEO is 100% AI-powered - only OpenAI is required.
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================
// TEST FUNCTIONS
// ============================================

async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    
    if (response.ok) {
      return { success: true, message: "OpenAI API connected successfully! 🥬" };
    }
    
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error.error?.message || `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testWordPressConnection(siteUrl: string, username: string, appPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const url = new URL("/wp-json/wp/v2/users/me", siteUrl);
    
    const response = await fetch(url.toString(), {
      headers: { "Authorization": `Basic ${auth}` },
    });
    
    if (response.ok) {
      const user = await response.json();
      return { success: true, message: `Connected as ${user.name || username}` };
    }
    
    return { success: false, error: `WordPress API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testGSCConnection(accessToken: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      const siteCount = data.siteEntry?.length || 0;
      return { success: true, message: `Connected! ${siteCount} site(s) available` };
    }
    
    return { success: false, error: `GSC API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ============================================
// POST - Test credentials
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, credentials } = body as { 
      type: string; 
      credentials?: Record<string, string>;
    };

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Missing integration type" },
        { status: 400 }
      );
    }

    let testResult: { success: boolean; message?: string; error?: string };

    switch (type) {
      case "openai":
        if (!credentials?.apiKey) {
          return NextResponse.json({ success: false, error: "API key required" }, { status: 400 });
        }
        testResult = await testOpenAIConnection(credentials.apiKey);
        break;

      case "wordpress":
        if (!credentials?.siteUrl || !credentials?.username || !credentials?.appPassword) {
          return NextResponse.json({ success: false, error: "Site URL, username, and app password required" }, { status: 400 });
        }
        testResult = await testWordPressConnection(credentials.siteUrl, credentials.username, credentials.appPassword);
        break;

      case "gsc":
        if (!credentials?.accessToken) {
          return NextResponse.json({ success: false, error: "Access token required" }, { status: 400 });
        }
        testResult = await testGSCConnection(credentials.accessToken);
        break;

      default:
        // For CMS and other integrations, just accept them
        testResult = { success: true, message: `${type} credentials saved` };
        break;
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error("Integration test error:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    }, { status: 500 });
  }
}
