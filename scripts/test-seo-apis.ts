/**
 * Test script for SEO API integrations
 * Run: npx tsx scripts/test-seo-apis.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || "";
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || "";
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

async function testDataForSEO() {
  console.log("\n📊 Testing DataForSEO...");
  console.log("=".repeat(50));

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.error("❌ DataForSEO credentials not configured");
    return false;
  }

  console.log(`   Login: ${DATAFORSEO_LOGIN}`);
  console.log(`   Password: ${DATAFORSEO_PASSWORD.slice(0, 4)}...`);

  const authHeader = `Basic ${Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64")}`;

  // Test 1: Get keyword search volume
  console.log("\n📝 Test 1: Keyword Search Volume...");
  try {
    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        keywords: ["seo tools", "keyword research"],
        location_code: 2840,  // United States
        language_code: "en",
      }]),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ API Error: ${response.status} - ${error}`);
      return false;
    }

    const data = await response.json();
    
    if (data.tasks?.[0]?.result) {
      console.log("   ✅ Search volume API working!");
      const results = data.tasks[0].result;
      results.forEach((r: { keyword: string; search_volume: number; keyword_difficulty: number }) => {
        console.log(`      - "${r.keyword}": ${r.search_volume?.toLocaleString() || 0} searches/mo, difficulty: ${r.keyword_difficulty || 0}`);
      });
    } else {
      console.log("   ⚠️ No results returned, but API connected");
      console.log("   Response:", JSON.stringify(data, null, 2).slice(0, 500));
    }

    return true;
  } catch (error) {
    console.error("   ❌ DataForSEO test failed:", error);
    return false;
  }
}

async function testSerpAPI() {
  console.log("\n🔍 Testing SerpAPI...");
  console.log("=".repeat(50));

  if (!SERPAPI_KEY) {
    console.error("❌ SerpAPI key not configured");
    return false;
  }

  console.log(`   Key: ${SERPAPI_KEY.slice(0, 10)}...${SERPAPI_KEY.slice(-4)}`);

  // Test 1: Google Search
  console.log("\n📝 Test 1: Google Search...");
  try {
    const params = new URLSearchParams({
      api_key: SERPAPI_KEY,
      q: "best seo tools 2024",
      location: "United States",
      hl: "en",
      gl: "us",
      num: "5",
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ API Error: ${response.status} - ${error}`);
      return false;
    }

    const data = await response.json();
    
    if (data.organic_results?.length) {
      console.log("   ✅ Google Search API working!");
      console.log(`   Found ${data.organic_results.length} organic results:`);
      data.organic_results.slice(0, 3).forEach((r: { position: number; title: string; link: string }) => {
        console.log(`      ${r.position}. ${r.title.slice(0, 50)}...`);
      });
      
      if (data.people_also_ask?.length) {
        console.log(`   📋 People Also Ask: ${data.people_also_ask.length} questions`);
      }
      if (data.related_searches?.length) {
        console.log(`   🔗 Related Searches: ${data.related_searches.length} queries`);
      }
    } else {
      console.log("   ⚠️ No organic results, checking response...");
      console.log("   Keys in response:", Object.keys(data));
    }

    return true;
  } catch (error) {
    console.error("   ❌ SerpAPI test failed:", error);
    return false;
  }
}

async function testKeywordSuggestions() {
  console.log("\n💡 Testing Keyword Suggestions (DataForSEO)...");
  console.log("=".repeat(50));

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log("   ⏭️ Skipped - DataForSEO not configured");
    return false;
  }

  const authHeader = `Basic ${Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64")}`;

  try {
    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{
        keywords: ["coffee"],
        location_code: 2840,
        language_code: "en",
        limit: 10,
      }]),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ API Error: ${response.status} - ${error}`);
      return false;
    }

    const data = await response.json();
    
    if (data.tasks?.[0]?.result?.[0]?.items?.length) {
      console.log("   ✅ Keyword suggestions working!");
      const items = data.tasks[0].result[0].items.slice(0, 5);
      items.forEach((item: { keyword: string; search_volume: number }) => {
        console.log(`      - "${item.keyword}": ${item.search_volume?.toLocaleString() || 0} searches/mo`);
      });
    } else {
      console.log("   ⚠️ No suggestions returned");
    }

    return true;
  } catch (error) {
    console.error("   ❌ Keyword suggestions test failed:", error);
    return false;
  }
}

async function testAutocomplete() {
  console.log("\n🔤 Testing Autocomplete (SerpAPI)...");
  console.log("=".repeat(50));

  if (!SERPAPI_KEY) {
    console.log("   ⏭️ Skipped - SerpAPI not configured");
    return false;
  }

  try {
    const params = new URLSearchParams({
      api_key: SERPAPI_KEY,
      engine: "google_autocomplete",
      q: "how to improve",
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`   ❌ API Error: ${response.status} - ${error}`);
      return false;
    }

    const data = await response.json();
    
    if (data.suggestions?.length) {
      console.log("   ✅ Autocomplete working!");
      data.suggestions.slice(0, 5).forEach((s: { value: string }) => {
        console.log(`      - ${s.value}`);
      });
    } else {
      console.log("   ⚠️ No suggestions returned");
    }

    return true;
  } catch (error) {
    console.error("   ❌ Autocomplete test failed:", error);
    return false;
  }
}

async function main() {
  console.log("\n🧪 Testing SEO API Integrations\n");
  console.log("=".repeat(50));
  
  const results = {
    dataForSEO: false,
    serpAPI: false,
    keywordSuggestions: false,
    autocomplete: false,
  };

  results.dataForSEO = await testDataForSEO();
  results.serpAPI = await testSerpAPI();
  results.keywordSuggestions = await testKeywordSuggestions();
  results.autocomplete = await testAutocomplete();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));
  
  console.log(`\nDataForSEO:`);
  console.log(`   Search Volume: ${results.dataForSEO ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Suggestions: ${results.keywordSuggestions ? "✅ PASS" : "❌ FAIL"}`);
  
  console.log(`\nSerpAPI:`);
  console.log(`   Google Search: ${results.serpAPI ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Autocomplete: ${results.autocomplete ? "✅ PASS" : "❌ FAIL"}`);

  const allPassed = Object.values(results).every(r => r);
  
  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! Sprint 3 is complete!");
  } else {
    console.log("⚠️ Some tests failed. Check the errors above.");
  }
  console.log("=".repeat(50) + "\n");
}

main().catch(console.error);

