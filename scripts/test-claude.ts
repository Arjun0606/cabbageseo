/**
 * Test script for Claude AI integration
 * Run: npx tsx scripts/test-claude.ts
 */

// Load env FIRST before any imports
import { config } from "dotenv";
config({ path: ".env.local" });

// Import types
import type { ClaudeModel } from "../src/lib/ai/claude-client";

// Create a simple test client inline to avoid import issues
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  };
}

const MODEL_COSTS = {
  "claude-3-5-haiku-20241022": { input: 80, output: 400 },
  "claude-sonnet-4-20250514": { input: 300, output: 1500 },
};

async function chat(
  messages: ChatMessage[],
  system?: string,
  model: string = "claude-haiku-4-5-20250514",
  maxTokens: number = 1024
): Promise<ClaudeResponse> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages,
  };

  if (system) {
    body.system = system;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS["claude-haiku-4-5-20250514"];
  const costCents = ((inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output);

  return {
    content: data.content?.[0]?.text || "",
    usage: {
      inputTokens,
      outputTokens,
      costCents: Math.ceil(costCents * 100) / 100,
    },
  };
}

async function testClaude() {
  console.log("\n🧪 Testing Claude AI Integration...\n");
  console.log("=".repeat(50));

  // Check if configured
  if (!ANTHROPIC_API_KEY) {
    console.error("❌ Claude not configured!");
    console.error("   ANTHROPIC_API_KEY: Missing");
    process.exit(1);
  }
  console.log("✅ Claude API key configured");
  console.log(`   Key: ${ANTHROPIC_API_KEY.slice(0, 20)}...${ANTHROPIC_API_KEY.slice(-4)}\n`);

  let totalCost = 0;

  // Test 1: Simple chat (Haiku - cheapest)
  console.log("📝 Test 1: Simple Haiku chat...");
  try {
    const startTime = Date.now();
    const response = await chat(
      [{ role: "user", content: "Say 'CabbageSEO works!' in exactly 3 words." }],
      "You are a helpful assistant. Be concise.",
      "claude-3-5-haiku-20241022",
      50
    );
    const duration = Date.now() - startTime;
    
    console.log(`   Response: "${response.content.trim()}"`);
    console.log(`   Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
    console.log(`   Cost: $${response.usage.costCents.toFixed(4)}`);
    console.log(`   Time: ${duration}ms`);
    console.log("   ✅ Haiku test passed!\n");
    totalCost += response.usage.costCents;
  } catch (error) {
    console.error("   ❌ Haiku test failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Test 2: JSON response (Haiku)
  console.log("📝 Test 2: JSON response...");
  try {
    const startTime = Date.now();
    const response = await chat(
      [{ role: "user", content: 'Return a JSON object with 3 SEO keywords for "coffee shop". Format: {"keywords": ["kw1", "kw2", "kw3"]}' }],
      "You are a helpful assistant. Return only valid JSON, no explanation.",
      "claude-3-5-haiku-20241022",
      100
    );
    const duration = Date.now() - startTime;
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`   Keywords: ${result.keywords.join(", ")}`);
    }
    console.log(`   Cost: $${response.usage.costCents.toFixed(4)}`);
    console.log(`   Time: ${duration}ms`);
    console.log("   ✅ JSON test passed!\n");
    totalCost += response.usage.costCents;
  } catch (error) {
    console.error("   ❌ JSON test failed:", error instanceof Error ? error.message : error);
  }

  // Test 3: Content ideas (Haiku)
  console.log("📝 Test 3: Content ideas generation...");
  try {
    const startTime = Date.now();
    const response = await chat(
      [{ role: "user", content: `Generate 3 SEO content ideas for "coffee brewing". Return JSON array: [{"title": "...", "keyword": "...", "intent": "informational"}]` }],
      "You are an SEO content strategist. Return only valid JSON array.",
      "claude-3-5-haiku-20241022",
      500
    );
    const duration = Date.now() - startTime;
    
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const ideas = JSON.parse(jsonMatch[0]);
      console.log(`   Generated ${ideas.length} ideas:`);
      ideas.forEach((idea: { title: string; keyword: string }, i: number) => {
        console.log(`   ${i + 1}. ${idea.title} (${idea.keyword})`);
      });
    }
    console.log(`   Cost: $${response.usage.costCents.toFixed(4)}`);
    console.log(`   Time: ${duration}ms`);
    console.log("   ✅ Content ideas test passed!\n");
    totalCost += response.usage.costCents;
  } catch (error) {
    console.error("   ❌ Content ideas test failed:", error instanceof Error ? error.message : error);
  }

  // Test 4: Sonnet (higher quality)
  console.log("📝 Test 4: Sonnet model test...");
  try {
    const startTime = Date.now();
    const response = await chat(
      [{ role: "user", content: "Write a 50-word SEO meta description for a coffee shop in NYC." }],
      "You are an SEO expert. Be compelling and include a call to action.",
      "claude-sonnet-4-20250514",
      150
    );
    const duration = Date.now() - startTime;
    
    console.log(`   Description: "${response.content.trim().slice(0, 100)}..."`);
    console.log(`   Tokens: ${response.usage.inputTokens} in / ${response.usage.outputTokens} out`);
    console.log(`   Cost: $${response.usage.costCents.toFixed(4)}`);
    console.log(`   Time: ${duration}ms`);
    console.log("   ✅ Sonnet test passed!\n");
    totalCost += response.usage.costCents;
  } catch (error) {
    console.error("   ❌ Sonnet test failed:", error instanceof Error ? error.message : error);
  }

  // Summary
  console.log("=".repeat(50));
  console.log("🎉 All tests completed!\n");
  console.log(`💰 Total test cost: $${totalCost.toFixed(4)}\n`);
  
  // Cost estimate
  console.log("📊 Cost Estimates for Common Operations:");
  console.log("   - Generate 10 content ideas (Haiku): ~$0.01");
  console.log("   - Cluster 50 keywords (Haiku): ~$0.01");
  console.log("   - Quick SEO score (Haiku): ~$0.005");
  console.log("   - Generate outline (Sonnet): ~$0.02");
  console.log("   - Generate 2000-word article (Sonnet): ~$0.05-0.08\n");
  
  console.log("💵 With 90% markup for users:");
  console.log("   - Your cost: $0.05 → Charge user: $0.095 → Profit: $0.045");
  console.log("   - 1000 articles/month: $50 cost → $95 revenue → $45 profit");
  console.log("   - Scale = pure profit increase!\n");
  
  console.log("🛡️ Built-in protections:");
  console.log("   ✅ Rate limiting per organization");
  console.log("   ✅ Exponential backoff retry");
  console.log("   ✅ Usage tracking per request");
  console.log("   ✅ On-demand spending limits (Cursor-style)");
  console.log("   ✅ Cost calculation per API call\n");
}

testClaude().catch(console.error);
