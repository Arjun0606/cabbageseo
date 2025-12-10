/**
 * Integration Management API
 * Handles storing, retrieving, and testing integration credentials
 */

import { NextRequest, NextResponse } from "next/server";

// In production, credentials would be encrypted and stored in DB
// For now, we'll validate the structure and simulate storage

interface IntegrationCredentials {
  id: string;
  credentials: Record<string, string>;
}

// Validate integration type
const VALID_INTEGRATIONS = [
  "anthropic",
  "openai", 
  "dataforseo",
  "serpapi",
  "ahrefs",
  "surfer",
  "gsc",
  "ga4",
  "wordpress",
  "webflow",
  "shopify",
  "dodo",
];

// Test functions for each integration
async function testAnthropicConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    const error = await response.text();
    return { success: false, error: `API returned ${response.status}: ${error}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testDataForSEOConnection(login: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = Buffer.from(`${login}:${password}`).toString("base64");
    
    const response = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        keyword: "test",
        location_code: 2840,
        language_code: "en",
        depth: 1,
      }]),
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testAhrefsConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/overview?target=ahrefs.com&mode=domain`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testWordPressConnection(
  siteUrl: string, 
  username: string, 
  appPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

// POST - Save and test integration credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as IntegrationCredentials;
    const { id, credentials } = body;
    
    // Validate integration type
    if (!VALID_INTEGRATIONS.includes(id)) {
      return NextResponse.json(
        { error: "Invalid integration type" },
        { status: 400 }
      );
    }
    
    // Test the connection based on integration type
    let testResult: { success: boolean; error?: string } = { success: false, error: "Unknown integration" };
    
    switch (id) {
      case "anthropic":
        if (!credentials.ANTHROPIC_API_KEY) {
          return NextResponse.json({ error: "API key required" }, { status: 400 });
        }
        testResult = await testAnthropicConnection(credentials.ANTHROPIC_API_KEY);
        break;
        
      case "openai":
        if (!credentials.OPENAI_API_KEY) {
          return NextResponse.json({ error: "API key required" }, { status: 400 });
        }
        testResult = await testOpenAIConnection(credentials.OPENAI_API_KEY);
        break;
        
      case "dataforseo":
        if (!credentials.DATAFORSEO_LOGIN || !credentials.DATAFORSEO_PASSWORD) {
          return NextResponse.json({ error: "Login and password required" }, { status: 400 });
        }
        testResult = await testDataForSEOConnection(
          credentials.DATAFORSEO_LOGIN,
          credentials.DATAFORSEO_PASSWORD
        );
        break;
        
      case "ahrefs":
        if (!credentials.AHREFS_API_KEY) {
          return NextResponse.json({ error: "API key required" }, { status: 400 });
        }
        testResult = await testAhrefsConnection(credentials.AHREFS_API_KEY);
        break;
        
      case "wordpress":
        if (!credentials.site_url || !credentials.username || !credentials.app_password) {
          return NextResponse.json({ error: "Site URL, username, and app password required" }, { status: 400 });
        }
        testResult = await testWordPressConnection(
          credentials.site_url,
          credentials.username,
          credentials.app_password
        );
        break;
        
      case "serpapi":
      case "surfer":
      case "webflow":
      case "shopify":
        // For these, we'll do a simple credential storage without live test
        // In production, implement proper test endpoints
        testResult = { success: true };
        break;
        
      case "gsc":
      case "ga4":
        // OAuth integrations are handled separately
        return NextResponse.json(
          { error: "OAuth integrations must use the OAuth flow" },
          { status: 400 }
        );
        
      default:
        testResult = { success: true };
    }
    
    if (!testResult.success) {
      return NextResponse.json(
        { 
          error: "Connection test failed",
          details: testResult.error,
        },
        { status: 400 }
      );
    }
    
    // In production: Encrypt and store credentials in database
    // For now, return success
    
    return NextResponse.json({
      success: true,
      integration: id,
      connectedAt: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Integration save error:", error);
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

// GET - List connected integrations
export async function GET() {
  // In production: Fetch from database
  // Return list of connected integrations (without exposing credentials)
  
  return NextResponse.json({
    integrations: [
      {
        id: "anthropic",
        connected: true,
        lastVerified: "2024-12-09T10:30:00Z",
      },
      {
        id: "dataforseo", 
        connected: true,
        lastVerified: "2024-12-09T10:30:00Z",
      },
    ],
  });
}

// DELETE - Disconnect an integration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id || !VALID_INTEGRATIONS.includes(id)) {
      return NextResponse.json(
        { error: "Invalid integration" },
        { status: 400 }
      );
    }
    
    // In production: Delete credentials from database
    
    return NextResponse.json({
      success: true,
      message: `Disconnected ${id}`,
    });
    
  } catch (error) {
    console.error("Integration delete error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}

