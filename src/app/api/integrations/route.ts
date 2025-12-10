/**
 * Integration Management API - Production Ready
 * Handles storing, retrieving, and testing integration credentials
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// ============================================
// ENCRYPTION UTILITIES
// ============================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32) || "default-key-change-in-production";

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

// ============================================
// INTEGRATION TEST FUNCTIONS
// ============================================

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
        messages: [{ role: "user", content: "test" }],
      }),
    });
    
    if (response.ok || response.status === 200) {
      return { success: true };
    }
    
    const error = await response.json().catch(() => ({}));
    return { 
      success: false, 
      error: error.error?.message || `API returned ${response.status}` 
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testDataForSEOConnection(login: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = Buffer.from(`${login}:${password}`).toString("base64");
    
    // Use a lightweight endpoint to test
    const response = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.status_code === 20000) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: data.status_message || `API returned ${response.status}` 
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testSerpAPIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`);
    
    if (response.ok) {
      return { success: true };
    }
    
    return { success: false, error: `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

// ============================================
// GET - List connected integrations
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ success: true, integrations: [] });
    }

    // Fetch integrations for this organization
    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("type, status, updated_at, created_at")
      .eq("organization_id", profile.organization_id);

    if (error) {
      console.error("Failed to fetch integrations:", error);
      return NextResponse.json({ success: true, integrations: [] });
    }

    return NextResponse.json({
      success: true,
      integrations: integrations || [],
    });

  } catch (error) {
    console.error("Integration GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Save integration credentials
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, credentials } = body as { type: string; credentials: Record<string, string> };

    if (!type || !credentials) {
      return NextResponse.json(
        { success: false, error: "Missing type or credentials" },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // Upsert the integration
    const { error: upsertError } = await supabase
      .from("integrations")
      .upsert({
        organization_id: profile.organization_id,
        type,
        credentials: { encrypted: encryptedCredentials },
        status: "active",
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "organization_id,type",
      });

    if (upsertError) {
      console.error("Failed to save integration:", upsertError);
      return NextResponse.json(
        { success: false, error: "Failed to save credentials" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} connected successfully`,
    });

  } catch (error) {
    console.error("Integration POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Disconnect integration
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type } = body as { type: string };

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Missing integration type" },
        { status: 400 }
      );
    }

    // Delete the integration
    const { error: deleteError } = await supabase
      .from("integrations")
      .delete()
      .eq("organization_id", profile.organization_id)
      .eq("type", type);

    if (deleteError) {
      console.error("Failed to delete integration:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type} disconnected`,
    });

  } catch (error) {
    console.error("Integration DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
