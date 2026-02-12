/**
 * Site GEO Audit Engine
 *
 * Analyzes a website's readiness for AI citation:
 * - Fetches pages in parallel (homepage + key subpages)
 * - Scores content structure, authority signals, Schema.org, citability, freshness, depth
 * - Uses GPT-5.2 for intelligent, site-specific tips (not templates)
 * - Uses a single batched Perplexity call for query discovery (not 6 serial calls)
 *
 * "We analyze your site the same way AI does."
 */

// ============================================
// TYPES
// ============================================

export interface SiteAnalysis {
  score: {
    overall: number;
    breakdown: {
      contentClarity: number;
      authoritySignals: number;
      structuredData: number;
      citability: number;
      freshness: number;
      topicalDepth: number;
    };
    grade: string;
    summary: string;
  };
  tips: Array<{
    id: string;
    category: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
  }>;
  queries: Array<{
    query: string;
    searchVolume: string;
    yourPosition: string;
    opportunity: boolean;
  }>;
  opportunities: Array<{
    query: string;
    platform: string;
    suggestedAction: string;
    difficulty: string;
  }>;
  rawData: {
    pagesAnalyzed: number;
    structuredDataFound: string[];
    headingsCount: number;
    listsCount: number;
    hasAuthorInfo: boolean;
    hasDates: boolean;
    wordCount: number;
    externalLinksCount: number;
  };
}

interface PageContent {
  url: string;
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  lists: string[];
  structuredData: object[];
  hasAuthor: boolean;
  hasDate: boolean;
  lastModified: string | null;
  externalLinks: string[];
  wordCount: number;
}

// ============================================
// FETCH & PARSE WEBSITE
// ============================================

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CabbageSEO-Bot/1.0 (GEO Analysis)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function parseHTML(html: string, url: string): PageContent {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const headings: { level: number; text: string }[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (text) headings.push({ level: parseInt(match[1]), text });
  }

  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pCount = 0;
  while ((match = pRegex.exec(html)) !== null && pCount < 20) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 50) {
      paragraphs.push(text);
      pCount++;
    }
  }

  const lists: string[] = [];
  const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  while ((match = listRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").trim();
    if (text) lists.push(text);
  }

  const structuredData: object[] = [];
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      structuredData.push(data);
    } catch {
      // Invalid JSON-LD
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasAuthor =
    /<[^>]*(?:class|id)=["'][^"']*author[^"']*["'][^>]*>/i.test(html) ||
    /<meta[^>]*name=["']author["']/i.test(html) ||
    structuredData.some((d: any) => d.author || d["@type"] === "Person");

  const hasDate =
    /<time[^>]*datetime/i.test(html) ||
    /<meta[^>]*property=["']article:published_time["']/i.test(html) ||
    /(?:published|updated|modified).*\d{4}/i.test(html);

  const modifiedMatch = html.match(/<meta[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i);
  const lastModified = modifiedMatch ? modifiedMatch[1] : null;

  const externalLinks: string[] = [];
  const domain = new URL(url).hostname;
  const linkRegex = /<a[^>]*href=["'](https?:\/\/[^"']+)["']/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const linkDomain = new URL(match[1]).hostname;
      if (linkDomain !== domain && !externalLinks.includes(linkDomain)) {
        externalLinks.push(linkDomain);
      }
    } catch {
      // Invalid URL
    }
  }

  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textContent.split(/\s+/).length;

  return {
    url, title, description, headings, paragraphs, lists, structuredData,
    hasAuthor, hasDate, lastModified, externalLinks, wordCount,
  };
}

// ============================================
// DISCOVER INTERNAL LINKS (crawl subpages)
// ============================================

function extractInternalLinks(html: string, domain: string): string[] {
  const links: Set<string> = new Set();
  const linkRegex = /<a[^>]*href=["']((?:https?:\/\/[^"']*|\/[^"']*))['"]/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];

    // Convert relative to absolute
    if (href.startsWith("/")) {
      href = `https://${domain}${href}`;
    }

    try {
      const url = new URL(href);
      if (url.hostname.replace("www.", "") === domain.replace("www.", "")) {
        const path = url.pathname.replace(/\/$/, "");
        // Skip non-content pages
        if (
          path &&
          path !== "" &&
          !path.match(/\.(css|js|png|jpg|gif|svg|ico|woff|pdf|xml|json)$/i) &&
          !path.includes("login") &&
          !path.includes("signup") &&
          !path.includes("admin") &&
          !path.includes("api/") &&
          !path.includes("#")
        ) {
          links.add(`https://${domain}${path}`);
        }
      }
    } catch {
      // Invalid URL
    }
  }

  return Array.from(links).slice(0, 10);
}

// ============================================
// SCORING HELPERS — Continuous curves
// ============================================

function smoothScale(value: number, halfPoint: number, maxOutput: number): number {
  if (value <= 0) return 0;
  return maxOutput * (value / (value + halfPoint));
}

function wordCountScore(wc: number, maxPoints: number): number {
  if (wc < 100) return maxPoints * (wc / 100) * 0.15;
  if (wc < 500) return maxPoints * 0.15 + maxPoints * 0.35 * ((wc - 100) / 400);
  if (wc <= 2500) return maxPoints * 0.5 + maxPoints * 0.5 * ((wc - 500) / 2000);
  if (wc <= 5000) return maxPoints;
  return maxPoints * Math.max(0.7, 1 - (wc - 5000) / 20000);
}

function freshnessDecay(daysSince: number, maxPoints: number): number {
  if (daysSince <= 0) return maxPoints;
  return maxPoints * Math.exp(-daysSince / 180);
}

// ============================================
// CALCULATE REAL SCORES
// ============================================

function calculateScores(pages: PageContent[]): SiteAnalysis["score"]["breakdown"] {
  if (pages.length === 0) {
    return {
      contentClarity: 28,
      authoritySignals: 25,
      structuredData: 15,
      citability: 22,
      freshness: 20,
      topicalDepth: 18,
    };
  }

  const avgWordCount = pages.reduce((sum, p) => sum + p.wordCount, 0) / pages.length;
  const avgHeadings = pages.reduce((sum, p) => sum + p.headings.length, 0) / pages.length;
  const avgLists = pages.reduce((sum, p) => sum + p.lists.length, 0) / pages.length;
  const hasStructuredData = pages.some(p => p.structuredData.length > 0);
  const hasAuthorInfo = pages.some(p => p.hasAuthor);
  const hasDates = pages.some(p => p.hasDate);
  const avgExternalLinks = pages.reduce((sum, p) => sum + p.externalLinks.length, 0) / pages.length;

  // Content Clarity (0-100)
  let contentClarity = 18;
  contentClarity += smoothScale(avgHeadings, 4, 28);
  contentClarity += smoothScale(avgLists, 2.5, 18);
  contentClarity += wordCountScore(avgWordCount, 22);
  const hasGoodStructure = pages.some(p => {
    const h1Index = p.headings.findIndex(h => h.level === 1);
    const h2Index = p.headings.findIndex(h => h.level === 2);
    return h1Index !== -1 && h2Index > h1Index;
  });
  if (hasGoodStructure) contentClarity += 14;
  contentClarity = Math.min(100, Math.round(contentClarity));

  // Authority Signals (0-100)
  let authoritySignals = 20;
  if (hasAuthorInfo) authoritySignals += 22;
  authoritySignals += smoothScale(avgExternalLinks, 3, 23);
  const authorityLinkCount = pages.reduce((sum, p) =>
    sum + p.externalLinks.filter(link =>
      link.endsWith(".gov") || link.endsWith(".edu") ||
      link.includes("wikipedia") || link.includes("reuters") ||
      link.includes("nytimes") || link.includes("harvard") ||
      link.includes("stanford") || link.includes("nature.com") ||
      link.includes("sciencedirect")
    ).length, 0);
  authoritySignals += smoothScale(authorityLinkCount, 2, 18);
  const authorFraction = pages.filter(p => p.hasAuthor).length / pages.length;
  authoritySignals += Math.round(authorFraction * 17);
  authoritySignals = Math.min(100, Math.round(authoritySignals));

  // Structured Data (0-100)
  let structuredDataScore = 12;
  if (hasStructuredData) {
    structuredDataScore += 30;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaTypes = pages.flatMap(p => p.structuredData.map((d: any) => d["@type"])).filter(Boolean);
    const uniqueTypes = new Set(schemaTypes);

    const typeScores: Record<string, number> = {
      Article: 10, BlogPosting: 10, FAQPage: 12, HowTo: 9,
      Organization: 8, Person: 7, Product: 8, Review: 6,
      WebPage: 4, BreadcrumbList: 5, LocalBusiness: 9,
    };
    let typeBonus = 0;
    for (const t of uniqueTypes) {
      typeBonus += typeScores[t as string] ?? 3;
    }
    structuredDataScore += Math.round(smoothScale(typeBonus, 15, 48));
  }
  structuredDataScore = Math.min(100, Math.round(structuredDataScore));

  // Citability (0-100)
  let citability = 15;
  const statsCount = pages.reduce((sum, p) =>
    sum + p.paragraphs.filter(para =>
      /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand|percent)/i.test(para)
    ).length, 0);
  citability += smoothScale(statsCount, 4, 22);
  const totalLists = pages.reduce((sum, p) => sum + p.lists.length, 0);
  citability += smoothScale(totalLists, 6, 16);
  const bestTitle = Math.max(...pages.map(p => p.title.length), 0);
  const bestDesc = Math.max(...pages.map(p => p.description.length), 0);
  citability += smoothScale(bestTitle, 40, 10) + smoothScale(bestDesc, 120, 10);
  citability += wordCountScore(avgWordCount, 17);
  if (statsCount > 0 && totalLists > 3) citability += 10;
  citability = Math.min(100, Math.round(citability));

  // Freshness (0-100)
  let freshness = 15;
  if (hasDates) freshness += 18;
  const modifiedDates = pages
    .filter(p => p.lastModified)
    .map(p => (Date.now() - new Date(p.lastModified!).getTime()) / (1000 * 60 * 60 * 24));
  if (modifiedDates.length > 0) {
    const mostRecentDays = Math.min(...modifiedDates);
    freshness += freshnessDecay(mostRecentDays, 42);
    const recentPages = modifiedDates.filter(d => d < 120).length;
    freshness += smoothScale(recentPages, 2, 12);
  } else if (hasDates) {
    freshness += 13;
  }
  freshness = Math.min(100, Math.round(freshness));

  // Topical Depth (0-100)
  let topicalDepth = 12;
  topicalDepth += wordCountScore(avgWordCount, 25);
  topicalDepth += smoothScale(pages.length, 2, 22);
  const uniqueH2s = new Set(
    pages.flatMap(p => p.headings.filter(h => h.level === 2).map(h => h.text.toLowerCase()))
  );
  topicalDepth += smoothScale(uniqueH2s.size, 6, 24);
  const avgParagraphs = pages.reduce((sum, p) => sum + p.paragraphs.length, 0) / pages.length;
  topicalDepth += smoothScale(avgParagraphs, 10, 17);
  topicalDepth = Math.min(100, Math.round(topicalDepth));

  return { contentClarity, authoritySignals, structuredData: structuredDataScore, citability, freshness, topicalDepth };
}

// ============================================
// AI-POWERED TIPS — GPT-5.2 for site-specific advice
// ============================================

async function generateAITips(
  domain: string,
  pages: PageContent[],
  scores: SiteAnalysis["score"]["breakdown"]
): Promise<SiteAnalysis["tips"]> {
  const apiKey = process.env.OPENAI_API_KEY;

  // Build a content summary for GPT
  const contentSummary = pages.map(p => ({
    url: p.url,
    title: p.title,
    description: p.description.slice(0, 150),
    headings: p.headings.slice(0, 8).map(h => `H${h.level}: ${h.text}`),
    wordCount: p.wordCount,
    hasAuthor: p.hasAuthor,
    hasDate: p.hasDate,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schemaTypes: p.structuredData.map((d: any) => d["@type"]).filter(Boolean),
    externalLinks: p.externalLinks.length,
    lists: p.lists.length,
    statsCount: p.paragraphs.filter(para =>
      /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)/i.test(para)
    ).length,
  }));

  if (apiKey && pages.length > 0) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: "You are a GEO (Generative Engine Optimization) auditor. You analyze websites for AI-citability and give specific, actionable advice. Never generic tips — reference the actual pages and content you see. Respond in JSON only.",
            },
            {
              role: "user",
              content: `Audit ${domain} for AI visibility. Give the 5-6 most impactful, specific tips to improve AI citation.

SCORE BREAKDOWN:
- Content Clarity: ${scores.contentClarity}/100
- Authority Signals: ${scores.authoritySignals}/100
- Structured Data: ${scores.structuredData}/100
- Citability: ${scores.citability}/100
- Freshness: ${scores.freshness}/100
- Topical Depth: ${scores.topicalDepth}/100

PAGES ANALYZED:
${JSON.stringify(contentSummary, null, 1).slice(0, 3000)}

FIRST PAGE CONTENT SAMPLE:
${pages[0]?.paragraphs.slice(0, 3).join("\n").slice(0, 500) || "No content extracted"}

RULES:
- Reference specific pages (by URL) and content you see
- Include the EXACT Schema.org types to add if structured data score is low
- If headings are weak, suggest SPECIFIC heading rewrites
- If meta description is missing, write a suggested one
- Estimate score impact for each tip
- Sort by impact (highest first)

Return JSON:
{
  "tips": [
    {
      "id": "unique-id",
      "category": "Content Structure | Authority | Technical | Content | Maintenance",
      "priority": "high | medium | low",
      "title": "Specific actionable title",
      "description": "Specific advice referencing actual content from the site. Include exactly what to do.",
      "impact": "+X potential score increase"
    }
  ]
}`,
            },
          ],
          max_completion_tokens: 3000,
          reasoning: { effort: "medium" },
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (fenceMatch) content = fenceMatch[1].trim();

        const parsed = JSON.parse(content);
        if (parsed.tips && parsed.tips.length > 0) {
          return parsed.tips.slice(0, 6);
        }
      }
    } catch {
      // Fall through to rule-based tips
    }
  }

  // Fallback: rule-based tips (same quality as before)
  return generateRuleBasedTips(pages, scores);
}

function generateRuleBasedTips(
  pages: PageContent[],
  scores: SiteAnalysis["score"]["breakdown"],
): SiteAnalysis["tips"] {
  const tips: SiteAnalysis["tips"] = [];

  if (scores.structuredData < 60) {
    const hasAnySchema = pages.some(p => p.structuredData.length > 0);
    tips.push({
      id: "structured-data",
      category: "Technical",
      priority: "high",
      title: hasAnySchema ? "Enhance Your Structured Data" : "Add Structured Data Markup",
      description: hasAnySchema
        ? "You have some structured data, but adding FAQ or HowTo schema would significantly improve AI understanding."
        : "No JSON-LD structured data found. Adding schema.org markup helps AI understand and cite your content.",
      impact: "+15-25 potential score increase",
    });
  }

  if (scores.contentClarity < 65) {
    const avgHeadings = pages.reduce((sum, p) => sum + p.headings.length, 0) / Math.max(pages.length, 1);
    if (avgHeadings < 4) {
      tips.push({
        id: "headings",
        category: "Content Structure",
        priority: "high",
        title: "Add More Descriptive Headings",
        description: `Your pages average only ${Math.round(avgHeadings)} headings. AI extracts information from heading structure — use H2s and H3s to break up content into clear sections.`,
        impact: "+10-15 potential score increase",
      });
    }
  }

  if (scores.authoritySignals < 60) {
    const hasAuthor = pages.some(p => p.hasAuthor);
    if (!hasAuthor) {
      tips.push({
        id: "author",
        category: "Authority",
        priority: "high",
        title: "Add Author Information",
        description: "No author information detected. Adding author bios with credentials significantly increases trust and citability.",
        impact: "+10-15 potential score increase",
      });
    }
  }

  if (scores.citability < 70) {
    tips.push({
      id: "quotable",
      category: "Content",
      priority: "medium",
      title: "Create Quotable Statements",
      description: "Add clear, concise statements that AI can easily extract. Think self-contained facts with specific numbers.",
      impact: "+8-12 potential score increase",
    });
  }

  if (scores.freshness < 55) {
    const hasDates = pages.some(p => p.hasDate);
    tips.push({
      id: "freshness",
      category: "Maintenance",
      priority: hasDates ? "medium" : "high",
      title: hasDates ? "Update Content More Frequently" : "Add Publication Dates",
      description: hasDates
        ? "Your content may be outdated. AI prefers recent information — update key pages quarterly."
        : "No publication dates found. Add 'Published' and 'Last Updated' dates to signal content freshness.",
      impact: "+10-15 potential score increase",
    });
  }

  if (scores.topicalDepth < 60) {
    const avgWordCount = pages.reduce((sum, p) => sum + p.wordCount, 0) / Math.max(pages.length, 1);
    if (avgWordCount < 1000) {
      tips.push({
        id: "depth",
        category: "Content",
        priority: "medium",
        title: "Expand Content Depth",
        description: `Your pages average ${Math.round(avgWordCount)} words. For comprehensive coverage that AI cites, aim for 1,500-2,500 words on key topics.`,
        impact: "+10-15 potential score increase",
      });
    }
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  return tips.slice(0, 6);
}

// ============================================
// QUERY DISCOVERY — Single batched Perplexity call + AI
// ============================================

async function discoverQueries(
  domain: string,
  pages: PageContent[],
): Promise<SiteAnalysis["queries"]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  // Step 1: Use GPT-5.2 to generate realistic customer queries based on actual site content
  let aiQueries: string[] = [];
  if (apiKey && pages.length > 0) {
    try {
      const siteInfo = {
        domain,
        title: pages[0]?.title || "",
        description: pages[0]?.description || "",
        headings: pages.flatMap(p => p.headings.slice(0, 5).map(h => h.text)).slice(0, 15),
        firstParagraph: pages[0]?.paragraphs[0]?.slice(0, 200) || "",
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            {
              role: "user",
              content: `Given this website, generate 6 realistic queries that a potential customer would type into ChatGPT, Perplexity, or Google AI — the exact kind of queries where this site SHOULD appear.

SITE:
Domain: ${siteInfo.domain}
Title: ${siteInfo.title}
Description: ${siteInfo.description}
Key headings: ${siteInfo.headings.join(" | ")}
First paragraph: ${siteInfo.firstParagraph}

Generate queries across these types:
- 2 discovery queries ("best X for Y", "what is the best...")
- 2 specific queries ("how to X", "X vs Y", "does X work for...")
- 2 brand queries ("what is ${domain.split(".")[0]}?", "${domain.split(".")[0]} review")

Return ONLY the queries, one per line. No numbering, no labels.`,
            },
          ],
          max_completion_tokens: 500,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        aiQueries = text.split("\n")
          .map((l: string) => l.trim().replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, ""))
          .filter((q: string) => q.length > 10 && q.length < 150);
      }
    } catch {
      // Fall through to defaults
    }
  }

  // Fallback if AI generation failed
  if (aiQueries.length < 3) {
    const name = domain.split(".")[0];
    const cleanName = name.charAt(0).toUpperCase() + name.slice(1);
    aiQueries = [
      `What is ${cleanName}?`,
      `${cleanName} review`,
      `best ${cleanName} alternatives`,
      `how to use ${cleanName}`,
      `is ${cleanName} worth it`,
    ];
  }

  // Step 2: Check all queries in a single batched Perplexity call
  if (!perplexityKey) {
    return aiQueries.map(q => ({
      query: q,
      searchVolume: "medium",
      yourPosition: "unknown",
      opportunity: true,
    }));
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are checking whether the website ${domain} is mentioned or cited when answering these queries. For each query, answer it naturally and note whether ${domain} appears in your response or sources.`,
          },
          {
            role: "user",
            content: `Answer each of these queries briefly. For each one, note if ${domain} is mentioned in your answer or sources.\n\n${aiQueries.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
          },
        ],
        return_citations: true,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return aiQueries.map(q => ({
        query: q,
        searchVolume: "medium",
        yourPosition: "unknown",
        opportunity: true,
      }));
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || "").toLowerCase();
    const citations: string[] = (data.citations || []).map((c: string) => c.toLowerCase());
    const domainLower = domain.toLowerCase();

    // Check each query for mention
    return aiQueries.map(q => {
      // Check if domain appears near the query text in the response
      const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const querySection = queryWords.some(w => content.includes(w));

      const isCited = citations.some(c => c.includes(domainLower)) ||
                      (querySection && content.includes(domainLower));

      return {
        query: q,
        searchVolume: "medium",
        yourPosition: isCited ? "cited" : "not cited",
        opportunity: !isCited,
      };
    });
  } catch {
    return aiQueries.map(q => ({
      query: q,
      searchVolume: "medium",
      yourPosition: "unknown",
      opportunity: true,
    }));
  }
}

// ============================================
// MAIN ANALYZER
// ============================================

export async function analyzeSite(domain: string): Promise<SiteAnalysis> {
  console.log(`[GEO Audit] Starting analysis for ${domain}`);

  // Step 1: Fetch homepage first
  const homepageHtml = await fetchPage(`https://${domain}`);
  const wwwHtml = homepageHtml ? null : await fetchPage(`https://www.${domain}`);
  const primaryHtml = homepageHtml || wwwHtml;

  const pages: PageContent[] = [];

  if (primaryHtml) {
    const homepage = parseHTML(primaryHtml, `https://${domain}`);
    pages.push(homepage);

    // Step 2: Discover internal links from homepage and fetch them in parallel
    const internalLinks = extractInternalLinks(primaryHtml, domain);
    // Also add common pages
    const commonPages = [`https://${domain}/about`, `https://${domain}/blog`, `https://${domain}/pricing`];
    const allLinks = [...new Set([...internalLinks, ...commonPages])].slice(0, 8);

    const subpageResults = await Promise.all(
      allLinks.map(async (url) => {
        const html = await fetchPage(url);
        if (html) return parseHTML(html, url);
        return null;
      })
    );

    for (const page of subpageResults) {
      if (page) pages.push(page);
    }
  } else {
    console.log(`[GEO Audit] Could not fetch any pages for ${domain}`);
  }

  console.log(`[GEO Audit] Analyzed ${pages.length} pages for ${domain}`);

  // Step 3: Calculate scores
  const breakdown = calculateScores(pages);

  const weights = {
    contentClarity: 0.20,
    authoritySignals: 0.15,
    structuredData: 0.20,
    citability: 0.25,
    freshness: 0.10,
    topicalDepth: 0.10,
  };

  const overall = Math.round(
    breakdown.contentClarity * weights.contentClarity +
    breakdown.authoritySignals * weights.authoritySignals +
    breakdown.structuredData * weights.structuredData +
    breakdown.citability * weights.citability +
    breakdown.freshness * weights.freshness +
    breakdown.topicalDepth * weights.topicalDepth
  );

  let grade: string;
  if (overall >= 90) grade = "A+";
  else if (overall >= 80) grade = "A";
  else if (overall >= 72) grade = "B+";
  else if (overall >= 65) grade = "B";
  else if (overall >= 57) grade = "C+";
  else if (overall >= 50) grade = "C";
  else if (overall >= 40) grade = "D+";
  else grade = "D";

  let summary = "";
  if (overall >= 80) {
    summary = `Your site scores ${overall}/100 for AI visibility. Strong across most dimensions — focus on maintaining freshness and expanding citability.`;
  } else if (overall >= 65) {
    summary = `Your site scores ${overall}/100. Good foundation with clear opportunities — the tips below could push you above 80.`;
  } else if (overall >= 50) {
    summary = `Your site scores ${overall}/100. AI systems have limited signals to cite you — prioritize the high-impact tips below.`;
  } else {
    summary = `Your site scores ${overall}/100. Significant room for improvement — start with structured data and content depth.`;
  }

  // Step 4: Generate tips and discover queries in parallel
  const [tips, queries] = await Promise.all([
    generateAITips(domain, pages, breakdown),
    discoverQueries(domain, pages),
  ]);

  // Step 5: Generate opportunities from gaps
  const opportunities = queries
    .filter(q => q.yourPosition !== "cited")
    .slice(0, 5)
    .map(q => ({
      query: q.query,
      platform: "Perplexity",
      suggestedAction: `Create or optimize content specifically targeting "${q.query}"`,
      difficulty: "medium",
    }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = {
    pagesAnalyzed: pages.length,
    structuredDataFound: pages.flatMap(p =>
      p.structuredData.map((d: any) => d["@type"]).filter(Boolean)
    ),
    headingsCount: pages.reduce((sum, p) => sum + p.headings.length, 0),
    listsCount: pages.reduce((sum, p) => sum + p.lists.length, 0),
    hasAuthorInfo: pages.some(p => p.hasAuthor),
    hasDates: pages.some(p => p.hasDate),
    wordCount: pages.reduce((sum, p) => sum + p.wordCount, 0),
    externalLinksCount: pages.reduce((sum, p) => sum + p.externalLinks.length, 0),
  };

  console.log(`[GEO Audit] Complete for ${domain}: Score ${overall} (${grade}), ${pages.length} pages`);

  return {
    score: { overall, breakdown, grade, summary },
    tips,
    queries,
    opportunities,
    rawData,
  };
}
