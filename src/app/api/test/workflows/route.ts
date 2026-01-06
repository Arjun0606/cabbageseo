/**
 * User Workflow Test Endpoint
 * 
 * Simulates complete user journeys:
 * 1. New user signup flow
 * 2. Add site flow
 * 3. Check citations flow
 * 4. View GEO Intelligence flow
 * 5. Upgrade plan flow
 * 6. Manage notifications flow
 * 
 * GET /api/test/workflows?secret=YOUR_TEST_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeSite } from "@/lib/geo/site-analyzer";

interface TestResult {
  name: string;
  passed: boolean;
  duration?: number;
  error?: string;
  data?: unknown;
}

interface WorkflowSuite {
  workflow: string;
  description: string;
  tests: TestResult[];
}

const TEST_SECRET = process.env.TEST_SECRET || "cabbageseo-test-2024";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== TEST_SECRET) {
    return NextResponse.json({ error: "Invalid test secret" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const workflows: WorkflowSuite[] = [];
  
  // Test org/user for workflows
  let testOrgId: string | null = null;
  let testUserId: string | null = null;
  let testSiteId: string | null = null;

  try {
    // ============================================
    // WORKFLOW 1: New User Signup
    // ============================================
    const signupTests: TestResult[] = [];
    
    // Step 1: Create organization (happens on OAuth callback)
    const orgStart = Date.now();
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: "Test User's Organization",
        slug: `test-workflow-${Date.now()}`,
        plan: "starter",
        subscription_status: "active",
      } as never)
      .select("id, name, plan")
      .single();

    signupTests.push({
      name: "1.1 Create organization on signup",
      passed: !orgError && !!org,
      duration: Date.now() - orgStart,
      error: orgError?.message,
      data: org,
    });

    if (org) {
      testOrgId = (org as { id: string }).id;
    }

    // Step 2: Create user record
    if (testOrgId) {
      const userStart = Date.now();
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert({
          id: crypto.randomUUID(),
          organization_id: testOrgId,
          email: `workflow-test-${Date.now()}@test.cabbageseo.com`,
          role: "owner",
        } as never)
        .select("id, email")
        .single();

      signupTests.push({
        name: "1.2 Create user record",
        passed: !userError && !!user,
        duration: Date.now() - userStart,
        error: userError?.message,
        data: user,
      });

      if (user) {
        testUserId = (user as { id: string }).id;
      }
    }

    // Step 3: Initialize notification settings
    if (testUserId) {
      const notifStart = Date.now();
      const { data: notif, error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: testUserId,
          email_new_citation: true,
          email_lost_citation: true,
          email_weekly_digest: true,
        } as never)
        .select("id")
        .single();

      signupTests.push({
        name: "1.3 Initialize notification settings",
        passed: !notifError && !!notif,
        duration: Date.now() - notifStart,
        error: notifError?.message,
      });
    }

    workflows.push({
      workflow: "New User Signup",
      description: "OAuth callback → Create org → Create user → Init settings",
      tests: signupTests,
    });

    // ============================================
    // WORKFLOW 2: Add First Site
    // ============================================
    const addSiteTests: TestResult[] = [];

    if (testOrgId) {
      // Step 1: User submits domain
      const siteStart = Date.now();
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .insert({
          organization_id: testOrgId,
          domain: "example.com",
          name: "Example Site",
          total_citations: 0,
          citations_this_week: 0,
        } as never)
        .select("id, domain")
        .single();

      addSiteTests.push({
        name: "2.1 Add site to dashboard",
        passed: !siteError && !!site,
        duration: Date.now() - siteStart,
        error: siteError?.message,
        data: site,
      });

      if (site) {
        testSiteId = (site as { id: string }).id;
      }

      // Step 2: Initialize usage tracking
      const usageStart = Date.now();
      const period = new Date().toISOString().slice(0, 7);
      const { data: usage, error: usageError } = await supabase
        .from("usage")
        .upsert({
          organization_id: testOrgId,
          period,
          sites_used: 1,
          checks_used: 0,
        } as never)
        .select("id")
        .single();

      addSiteTests.push({
        name: "2.2 Initialize usage tracking",
        passed: !usageError && !!usage,
        duration: Date.now() - usageStart,
        error: usageError?.message,
      });
    }

    workflows.push({
      workflow: "Add First Site",
      description: "Enter domain → Save to DB → Init usage tracking",
      tests: addSiteTests,
    });

    // ============================================
    // WORKFLOW 3: Check Citations (Real API Test)
    // ============================================
    const citationTests: TestResult[] = [];

    // Test Perplexity API call
    if (process.env.PERPLEXITY_API_KEY) {
      const perplexityStart = Date.now();
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [{
              role: "user",
              content: "What are the best SEO tools for small businesses?",
            }],
          }),
        });

        const data = await response.json();
        const hasCitations = data.citations && data.citations.length > 0;

        citationTests.push({
          name: "3.1 Perplexity citation check",
          passed: response.ok,
          duration: Date.now() - perplexityStart,
          error: response.ok ? undefined : JSON.stringify(data.error),
          data: hasCitations ? `Found ${data.citations.length} citations` : "No citations in response",
        });
      } catch (e) {
        citationTests.push({
          name: "3.1 Perplexity citation check",
          passed: false,
          error: e instanceof Error ? e.message : "Unknown",
        });
      }
    }

    // Test Google AI API call
    if (process.env.GOOGLE_AI_API_KEY) {
      const googleStart = Date.now();
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: "What are the best SEO tools? Please cite sources.",
                }],
              }],
              tools: [{
                googleSearch: {},
              }],
            }),
          }
        );

        const data = await response.json();
        citationTests.push({
          name: "3.2 Google AI (Gemini) citation check",
          passed: response.ok,
          duration: Date.now() - googleStart,
          error: response.ok ? undefined : JSON.stringify(data),
          data: response.ok ? "API responded with grounding" : null,
        });
      } catch (e) {
        citationTests.push({
          name: "3.2 Google AI (Gemini) citation check",
          passed: false,
          error: e instanceof Error ? e.message : "Unknown",
        });
      }
    }

    // Test OpenAI API call
    if (process.env.OPENAI_API_KEY) {
      const openaiStart = Date.now();
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: "What is example.com? Is it a real website?",
            }],
            max_tokens: 150,
          }),
        });

        const data = await response.json();
        citationTests.push({
          name: "3.3 OpenAI (ChatGPT) knowledge check",
          passed: response.ok,
          duration: Date.now() - openaiStart,
          error: response.ok ? undefined : JSON.stringify(data),
          data: response.ok ? "API responded successfully" : null,
        });
      } catch (e) {
        citationTests.push({
          name: "3.3 OpenAI (ChatGPT) knowledge check",
          passed: false,
          error: e instanceof Error ? e.message : "Unknown",
        });
      }
    }

    // Test saving citation to database
    if (testSiteId) {
      const saveStart = Date.now();
      const { data: citation, error: citError } = await supabase
        .from("citations")
        .insert({
          site_id: testSiteId,
          platform: "perplexity",
          query: "best seo tools",
          snippet: "Example.com is a great SEO tool...",
          confidence: "medium",
        } as never)
        .select("id")
        .single();

      citationTests.push({
        name: "3.4 Save citation to database",
        passed: !citError && !!citation,
        duration: Date.now() - saveStart,
        error: citError?.message,
      });
    }

    workflows.push({
      workflow: "Check Citations",
      description: "Query AI platforms → Detect mentions → Save to DB",
      tests: citationTests,
    });

    // ============================================
    // WORKFLOW 4: GEO Intelligence Analysis
    // ============================================
    const geoTests: TestResult[] = [];

    // Test real site analysis
    const analyzeStart = Date.now();
    try {
      const analysis = await analyzeSite("https://example.com");
      
      geoTests.push({
        name: "4.1 Fetch and analyze website",
        passed: analysis.score.overall > 0,
        duration: Date.now() - analyzeStart,
        data: {
          score: analysis.score.overall,
          tipsCount: analysis.tips.length,
          queriesFound: analysis.queries.length,
        },
      });
    } catch (e) {
      geoTests.push({
        name: "4.1 Fetch and analyze website",
        passed: false,
        duration: Date.now() - analyzeStart,
        error: e instanceof Error ? e.message : "Unknown",
      });
    }

    // Test saving GEO analysis
    if (testSiteId && testOrgId) {
      const geoSaveStart = Date.now();
      const { data: geo, error: geoError } = await supabase
        .from("geo_analyses")
        .insert({
          site_id: testSiteId,
          organization_id: testOrgId,
          score: { overall: 72, breakdown: { clarity: 80, authority: 65 } },
          tips: [
            { title: "Add structured data", priority: "high" },
            { title: "Improve headings", priority: "medium" },
          ],
          queries: ["example.com review", "is example.com legit"],
        } as never)
        .select("id")
        .single();

      geoTests.push({
        name: "4.2 Save GEO analysis to database",
        passed: !geoError && !!geo,
        duration: Date.now() - geoSaveStart,
        error: geoError?.message,
      });
    }

    workflows.push({
      workflow: "GEO Intelligence Analysis",
      description: "Fetch site → Analyze content → Calculate score → Save",
      tests: geoTests,
    });

    // ============================================
    // WORKFLOW 5: Add Competitor
    // ============================================
    const competitorTests: TestResult[] = [];

    if (testSiteId) {
      const compStart = Date.now();
      const { data: comp, error: compError } = await supabase
        .from("competitors")
        .insert({
          site_id: testSiteId,
          domain: "competitor.com",
          name: "Main Competitor",
          total_citations: 0,
        } as never)
        .select("id")
        .single();

      competitorTests.push({
        name: "5.1 Add competitor to track",
        passed: !compError && !!comp,
        duration: Date.now() - compStart,
        error: compError?.message,
      });
    }

    workflows.push({
      workflow: "Add Competitor",
      description: "Enter competitor domain → Save to DB → Track citations",
      tests: competitorTests,
    });

    // ============================================
    // WORKFLOW 6: Billing/Checkout (Config Check)
    // ============================================
    const billingTests: TestResult[] = [];

    // Check Dodo is configured
    billingTests.push({
      name: "6.1 Dodo Payments API configured",
      passed: !!process.env.DODO_PAYMENTS_API_KEY,
      data: process.env.DODO_PAYMENTS_API_KEY ? "Configured" : "Missing",
    });

    // Check all product IDs
    const products = [
      { name: "Starter Monthly", env: "DODO_STARTER_MONTHLY_ID" },
      { name: "Starter Yearly", env: "DODO_STARTER_YEARLY_ID" },
      { name: "Pro Monthly", env: "DODO_PRO_MONTHLY_ID" },
      { name: "Pro Yearly", env: "DODO_PRO_YEARLY_ID" },
    ];

    for (const product of products) {
      billingTests.push({
        name: `6.2 ${product.name} product ID`,
        passed: !!process.env[product.env],
        data: process.env[product.env] ? `Set: ${process.env[product.env]}` : "Missing",
      });
    }

    workflows.push({
      workflow: "Billing/Checkout",
      description: "Select plan → Create checkout → Redirect to Dodo",
      tests: billingTests,
    });

    // ============================================
    // WORKFLOW 7: Email Alerts (Config Check)
    // ============================================
    const emailTests: TestResult[] = [];

    emailTests.push({
      name: "7.1 Resend API configured",
      passed: !!process.env.RESEND_API_KEY,
      data: process.env.RESEND_API_KEY ? "Configured" : "Missing",
    });

    // Test Resend API is reachable
    if (process.env.RESEND_API_KEY) {
      const resendStart = Date.now();
      try {
        const response = await fetch("https://api.resend.com/domains", {
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          },
        });
        
        emailTests.push({
          name: "7.2 Resend API reachable",
          passed: response.ok,
          duration: Date.now() - resendStart,
          data: `Status: ${response.status}`,
        });
      } catch (e) {
        emailTests.push({
          name: "7.2 Resend API reachable",
          passed: false,
          error: e instanceof Error ? e.message : "Unknown",
        });
      }
    }

    workflows.push({
      workflow: "Email Alerts",
      description: "New citation → Send email via Resend",
      tests: emailTests,
    });

    // ============================================
    // CLEANUP
    // ============================================
    const cleanupTests: TestResult[] = [];

    if (testOrgId) {
      const cleanStart = Date.now();
      
      // Clean up in reverse order
      if (testSiteId) {
        await supabase.from("geo_analyses").delete().eq("site_id", testSiteId);
        await supabase.from("citations").delete().eq("site_id", testSiteId);
        await supabase.from("competitors").delete().eq("site_id", testSiteId);
        await supabase.from("sites").delete().eq("id", testSiteId);
      }
      
      await supabase.from("usage").delete().eq("organization_id", testOrgId);
      
      if (testUserId) {
        await supabase.from("notifications").delete().eq("user_id", testUserId);
        await supabase.from("users").delete().eq("id", testUserId);
      }
      
      const { error: cleanError } = await supabase.from("organizations").delete().eq("id", testOrgId);
      
      cleanupTests.push({
        name: "Cleanup test data",
        passed: !cleanError,
        duration: Date.now() - cleanStart,
        error: cleanError?.message,
      });
    }

    // ============================================
    // SUMMARY
    // ============================================
    let totalPassed = 0;
    let totalFailed = 0;

    for (const wf of workflows) {
      for (const test of wf.tests) {
        if (test.passed) totalPassed++;
        else totalFailed++;
      }
    }

    for (const test of cleanupTests) {
      if (test.passed) totalPassed++;
      else totalFailed++;
    }

    return NextResponse.json({
      success: totalFailed === 0,
      summary: {
        total: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        workflows: workflows.length,
      },
      workflows,
      cleanup: cleanupTests,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Emergency cleanup
    if (testOrgId) {
      try {
        await supabase.from("organizations").delete().eq("id", testOrgId);
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      partialResults: workflows,
    }, { status: 500 });
  }
}

