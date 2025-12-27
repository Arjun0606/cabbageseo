/**
 * Export Report API
 * 
 * Generates exportable markdown reports for:
 * - SEO issues and fixes
 * - AIO recommendations  
 * - Content strategy
 * 
 * Designed to be fed to AI coding assistants (Cursor, Claude, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const TESTING_MODE = process.env.TESTING_MODE === "true";

interface IssueRow {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  recommendation: string | null;
  affected_url: string | null;
  suggested_value: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const reportType = searchParams.get("type") || "full"; // full, seo, aio

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = TESTING_MODE ? createServiceClient() : await createClient();
    } catch (e) {
      console.error("[Export Report] Service client error:", e);
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Get site info
    const { data: site } = await supabase
      .from("sites")
      .select("id, domain, seo_score, aio_score_avg")
      .eq("id", siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const typedSite = site as { id: string; domain: string; seo_score: number | null; aio_score_avg: number | null };

    // Get issues
    const { data: issues } = await supabase
      .from("issues")
      .select("*")
      .eq("site_id", siteId)
      .eq("status", "open")
      .order("severity", { ascending: true });

    const typedIssues = (issues || []) as IssueRow[];

    // Separate SEO and AIO issues
    const seoIssues = typedIssues.filter(i => !i.type.startsWith("aio_"));
    const aioIssues = typedIssues.filter(i => i.type.startsWith("aio_"));

    // Generate markdown report
    let markdown = `# Website Optimization Report for ${typedSite.domain}
Generated: ${new Date().toISOString().split('T')[0]}

## Summary
- **SEO Score:** ${typedSite.seo_score || 'N/A'}/100
- **AI Visibility Score:** ${typedSite.aio_score_avg || 'N/A'}/100
- **Total Issues Found:** ${typedIssues.length}
  - Critical: ${typedIssues.filter(i => i.severity === 'critical').length}
  - Warnings: ${typedIssues.filter(i => i.severity === 'warning').length}

---

`;

    if (reportType === "full" || reportType === "seo") {
      markdown += `## SEO Issues & Fixes

These are technical SEO issues that need to be addressed to improve search rankings.

`;

      if (seoIssues.length === 0) {
        markdown += `✅ No SEO issues found! Your site has good technical SEO.\n\n`;
      } else {
        // Group by severity
        const criticalSeo = seoIssues.filter(i => i.severity === "critical");
        const warningSeo = seoIssues.filter(i => i.severity === "warning");

        if (criticalSeo.length > 0) {
          markdown += `### 🔴 Critical Issues (Fix Immediately)\n\n`;
          for (const issue of criticalSeo) {
            markdown += formatIssue(issue);
          }
        }

        if (warningSeo.length > 0) {
          markdown += `### 🟡 Warnings (Should Fix)\n\n`;
          for (const issue of warningSeo) {
            markdown += formatIssue(issue);
          }
        }
      }
    }

    if (reportType === "full" || reportType === "aio") {
      markdown += `## AI Visibility Improvements

These changes will help your content get cited by AI assistants like ChatGPT, Perplexity, and Google AI Overviews.

`;

      if (aioIssues.length === 0) {
        markdown += `✅ Great AI visibility! Your content is well-structured for AI platforms.\n\n`;
      } else {
        const criticalAio = aioIssues.filter(i => i.severity === "critical");
        const warningAio = aioIssues.filter(i => i.severity === "warning");

        if (criticalAio.length > 0) {
          markdown += `### 🔴 High Priority AIO Fixes\n\n`;
          for (const issue of criticalAio) {
            markdown += formatAioIssue(issue);
          }
        }

        if (warningAio.length > 0) {
          markdown += `### 🟡 Recommended AIO Improvements\n\n`;
          for (const issue of warningAio) {
            markdown += formatAioIssue(issue);
          }
        }
      }
    }

    markdown += `---

## Implementation Guide

### For Developers (Feed this to Cursor/Claude)

\`\`\`
I need to implement the following changes for ${typedSite.domain}:

${typedIssues.slice(0, 10).map(i => `- ${i.title}: ${i.recommendation || i.description}`).join('\n')}
${typedIssues.length > 10 ? `\n... and ${typedIssues.length - 10} more issues` : ''}
\`\`\`

### Quick Implementation Steps

1. **Address Critical SEO Issues First** - These directly impact rankings
2. **Add Schema Markup** - JSON-LD for Article, FAQ, and HowTo
3. **Improve Content Structure** - Add FAQ sections, definitions, and key takeaways
4. **Optimize for AI** - Make content quotable with clear, concise statements

---

*Report generated by CabbageSEO - Your AI-powered SEO sidekick*
`;

    return NextResponse.json({
      success: true,
      data: {
        markdown,
        filename: `${typedSite.domain.replace(/\./g, '-')}-seo-report-${new Date().toISOString().split('T')[0]}.md`,
        issueCount: typedIssues.length,
        seoScore: typedSite.seo_score,
        aioScore: typedSite.aio_score_avg,
      }
    });

  } catch (error) {
    console.error("[Export Report] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}

function formatIssue(issue: IssueRow): string {
  let md = `#### ${issue.title}\n`;
  md += `- **Type:** ${issue.type.replace(/_/g, ' ')}\n`;
  if (issue.description) md += `- **Issue:** ${issue.description}\n`;
  if (issue.affected_url) md += `- **Affected URL:** ${issue.affected_url}\n`;
  if (issue.recommendation) md += `- **Fix:** ${issue.recommendation}\n`;
  if (issue.suggested_value) md += `- **Suggested Change:** ${issue.suggested_value}\n`;
  md += `\n`;
  return md;
}

function formatAioIssue(issue: IssueRow): string {
  let md = `#### ${issue.title}\n`;
  
  // Add context based on issue type
  const aioExplanations: Record<string, string> = {
    "aio_missing_faq": "FAQ sections are cited 3x more often by AI platforms.",
    "aio_missing_howto": "Step-by-step content is preferred by Google AI Overviews.",
    "aio_weak_quotability": "Short, factual sentences get cited more often.",
    "aio_no_expert_attribution": "Content with author credentials is trusted by Perplexity.",
    "aio_missing_definitions": "Direct definitions (X is...) are cited in AI snippets.",
    "aio_low_entity_density": "More named entities help AI understand your content.",
    "aio_poor_answer_structure": "Clear Q&A format is preferred by ChatGPT.",
  };
  
  if (aioExplanations[issue.type]) {
    md += `- **Why it matters:** ${aioExplanations[issue.type]}\n`;
  }
  if (issue.description) md += `- **Issue:** ${issue.description}\n`;
  if (issue.recommendation) md += `- **Fix:** ${issue.recommendation}\n`;
  md += `\n`;
  return md;
}

