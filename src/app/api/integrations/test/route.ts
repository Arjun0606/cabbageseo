/**
 * Integration Test API
 * Tests integration credentials before saving
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================
// TEST FUNCTIONS
// ============================================

async function testAnthropicConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
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
        messages: [{ role: "user", content: "Say 'connected'" }],
      }),
    });
    
    if (response.ok) {
      return { success: true, message: "Claude API connected successfully!" };
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

async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    
    if (response.ok) {
      return { success: true, message: "OpenAI API connected successfully!" };
    }
    
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error.error?.message || `API returned ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testDataForSEOConnection(login: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${login}:${password}`).toString("base64");
    
    const response = await fetch("https://api.dataforseo.com/v3/appendix/user_data", {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    
    if (response.ok && data.status_code === 20000) {
      const balance = data.tasks?.[0]?.result?.[0]?.money?.balance;
      return { 
        success: true, 
        message: `DataForSEO connected! Balance: $${balance?.toFixed(2) || 'N/A'}` 
      };
    }
    
    return { 
      success: false, 
      error: data.status_message || `API returned ${response.status}` 
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Connection failed" };
  }
}

async function testSerpAPIConnection(apiKey: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: `SerpAPI connected! Searches remaining: ${data.total_searches_left || 'N/A'}` 
      };
    }
    
    return { success: false, error: `API returned ${response.status}` };
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
      case "anthropic":
        if (!credentials?.apiKey) {
          return NextResponse.json({ success: false, error: "API key required" }, { status: 400 });
        }
        testResult = await testAnthropicConnection(credentials.apiKey);
        break;

      case "openai":
        if (!credentials?.apiKey) {
          return NextResponse.json({ success: false, error: "API key required" }, { status: 400 });
        }
        testResult = await testOpenAIConnection(credentials.apiKey);
        break;

      case "dataforseo":
        if (!credentials?.login || !credentials?.password) {
          return NextResponse.json({ success: false, error: "Login and password required" }, { status: 400 });
        }
        testResult = await testDataForSEOConnection(credentials.login, credentials.password);
        break;

      case "serpapi":
        if (!credentials?.apiKey) {
          return NextResponse.json({ success: false, error: "API key required" }, { status: 400 });
        }
        testResult = await testSerpAPIConnection(credentials.apiKey);
        break;

      default:
        // For unknown types, just accept them
        testResult = { success: true, message: `${type} credentials saved` };
    }

    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: testResult.error || "Connection test failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: testResult.message,
    });

  } catch (error) {
    console.error("Integration test error:", error);
    return NextResponse.json(
      { success: false, error: "Test failed" },
      { status: 500 }
    );
  }
}

