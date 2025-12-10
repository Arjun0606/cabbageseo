/**
 * Integration test for the complete SEO Data Service
 * Tests real API calls through our unified service layer
 * 
 * Run: npx tsx scripts/test-seo-integration.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

// Need to set env vars before importing the service
process.env.DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || "arjun@cabbageseo.com";
process.env.DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || "96964f5ab86f67ca";
process.env.SERPAPI_KEY = process.env.SERPAPI_KEY || "09c1f79b098331f097fc4f3c7715298ae38aa776d28f68c6b7e0487b0770a10e";

import { SEODataService } from "../src/lib/seo/data-service";

async function testSEODataService() {
  console.log("\n🧪 CabbageSEO - SEO Data Integration Tests\n");
  console.log("=".repeat(60));

  const seoService = new SEODataService({ trackUsage: false }); // Disable billing for tests
  
  // Check provider status
  const status = seoService.getProviderStatus();
  console.log("\n📡 Provider Status:");
  console.log(`   DataForSEO: ${status.dataForSEO ? "✅ Connected" : "❌ Not configured"}`);
  console.log(`   SerpAPI: ${status.serpAPI ? "✅ Connected" : "❌ Not configured"}`);
  console.log(`   Any Available: ${status.anyAvailable ? "✅ Yes" : "❌ No"}`);

  if (!status.anyAvailable) {
    console.error("\n❌ No SEO providers configured. Cannot run tests.");
    process.exit(1);
  }

  const results: Record<string, boolean> = {};
  let startTime: number;

  // Test 1: Keyword Metrics
  console.log("\n" + "=".repeat(60));
  console.log("📝 TEST 1: Keyword Metrics");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const keywords = ["seo tools", "content marketing"];
    console.log(`   Keywords: ${keywords.join(", ")}`);
    
    const metrics = await seoService.getKeywordMetrics(keywords);
    
    if (metrics.length > 0) {
      console.log(`   ✅ Got ${metrics.length} keyword metrics`);
      metrics.forEach(m => {
        console.log(`      - "${m.keyword}": ${m.volume.toLocaleString()}/mo, difficulty: ${m.difficulty}, CPC: $${m.cpc.toFixed(2)}`);
      });
      results["Keyword Metrics"] = true;
    } else {
      console.log("   ⚠️ No metrics returned");
      results["Keyword Metrics"] = false;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["Keyword Metrics"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Test 2: Keyword Suggestions
  console.log("\n" + "=".repeat(60));
  console.log("💡 TEST 2: Keyword Suggestions");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const seed = "seo";
    console.log(`   Seed keyword: "${seed}"`);
    
    const suggestions = await seoService.getKeywordSuggestions(seed, { limit: 10 });
    
    if (suggestions.length > 0) {
      console.log(`   ✅ Got ${suggestions.length} suggestions`);
      suggestions.slice(0, 5).forEach(s => {
        console.log(`      - "${s.keyword}"${s.volume > 0 ? `: ${s.volume.toLocaleString()}/mo` : ""}`);
      });
      results["Keyword Suggestions"] = true;
    } else {
      console.log("   ⚠️ No suggestions returned");
      results["Keyword Suggestions"] = false;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["Keyword Suggestions"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Test 3: SERP Analysis
  console.log("\n" + "=".repeat(60));
  console.log("🔍 TEST 3: SERP Analysis");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const keyword = "best seo tools 2024";
    console.log(`   Keyword: "${keyword}"`);
    
    const serp = await seoService.analyzeSERP(keyword);
    
    console.log(`   ✅ SERP Analysis complete`);
    console.log(`      Total results: ${serp.totalResults?.toLocaleString() || "N/A"}`);
    console.log(`      Organic results: ${serp.organicResults?.length || 0}`);
    
    if (serp.organicResults?.length) {
      console.log(`      Top 3:`);
      serp.organicResults.slice(0, 3).forEach((r, i) => {
        console.log(`         ${i + 1}. ${r.title?.slice(0, 50) || "N/A"}...`);
        console.log(`            ${r.url?.slice(0, 60) || "N/A"}`);
      });
    }
    
    if (serp.peopleAlsoAsk?.length) {
      console.log(`      People Also Ask (${serp.peopleAlsoAsk.length}):`);
      serp.peopleAlsoAsk.slice(0, 3).forEach(q => {
        console.log(`         - ${q}`);
      });
    }
    
    if (serp.relatedSearches?.length) {
      console.log(`      Related Searches: ${serp.relatedSearches.length}`);
    }
    
    results["SERP Analysis"] = true;
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["SERP Analysis"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Test 4: Ranking Check
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST 4: Ranking Check");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const keyword = "project management software";
    const domain = "asana.com";
    console.log(`   Keyword: "${keyword}"`);
    console.log(`   Domain: ${domain}`);
    
    const ranking = await seoService.checkRanking(keyword, domain);
    
    if (ranking.position !== null) {
      console.log(`   ✅ Ranking found`);
      console.log(`      Position: #${ranking.position}`);
      console.log(`      URL: ${ranking.url || "N/A"}`);
      results["Ranking Check"] = true;
    } else {
      console.log(`   ℹ️ Domain not found in top 100 results`);
      results["Ranking Check"] = true; // API worked, just no ranking
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["Ranking Check"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Test 5: Questions (PAA)
  console.log("\n" + "=".repeat(60));
  console.log("❓ TEST 5: People Also Ask");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const keyword = "how to do seo";
    console.log(`   Keyword: "${keyword}"`);
    
    const questions = await seoService.getQuestions(keyword);
    
    if (questions.length > 0) {
      console.log(`   ✅ Got ${questions.length} questions`);
      questions.slice(0, 4).forEach(q => {
        console.log(`      - ${q}`);
      });
      results["PAA Questions"] = true;
    } else {
      console.log(`   ℹ️ No PAA questions for this query`);
      results["PAA Questions"] = true; // Not all queries have PAA
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["PAA Questions"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Test 6: Related Searches
  console.log("\n" + "=".repeat(60));
  console.log("🔗 TEST 6: Related Searches");
  console.log("=".repeat(60));
  startTime = Date.now();
  try {
    const keyword = "content marketing strategy";
    console.log(`   Keyword: "${keyword}"`);
    
    const related = await seoService.getRelatedSearches(keyword);
    
    if (related.length > 0) {
      console.log(`   ✅ Got ${related.length} related searches`);
      related.slice(0, 5).forEach(r => {
        console.log(`      - ${r}`);
      });
      results["Related Searches"] = true;
    } else {
      console.log(`   ℹ️ No related searches returned`);
      results["Related Searches"] = true;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error}`);
    results["Related Searches"] = false;
  }
  console.log(`   ⏱️ ${Date.now() - startTime}ms`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`   ${passed ? "✅" : "❌"} ${name}`);
  });
  
  console.log("\n" + "=".repeat(60));
  if (passed === total) {
    console.log(`🎉 ALL ${total} TESTS PASSED! Sprint 3 SEO Data Layer is COMPLETE!`);
  } else {
    console.log(`⚠️ ${passed}/${total} tests passed. Check errors above.`);
  }
  console.log("=".repeat(60) + "\n");

  return passed === total;
}

testSEODataService().catch(console.error);

