/**
 * Unified Analyzer - Single source of truth for SEO + AIO scoring
 * 
 * This module provides consistent scoring across:
 * - Marketing free analyzer
 * - Dashboard onboarding
 * - Full site audits
 * - Individual page analysis
 * 
 * Scoring is out of 100 for both SEO and AIO.
 */

// ============================================
// TYPES
// ============================================

export interface ScoreItem {
  name: string;
  score: number;
  maxScore: number;
  status: "pass" | "warning" | "fail";
  reason: string;
  howToFix?: string;
}

export interface SEOBreakdown {
  technical: ScoreItem[];
  content: ScoreItem[];
  meta: ScoreItem[];
  performance: ScoreItem[];
  accessibility: ScoreItem[];
}

export interface AIOBreakdown {
  structure: ScoreItem[];
  authority: ScoreItem[];
  schema: ScoreItem[];
  contentQuality: ScoreItem[];
  quotability: ScoreItem[];
}

export interface PageInput {
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  h2?: string[];
  h3?: string[];
  wordCount?: number;
  images?: Array<{ alt?: string | null; src: string }>;
  links?: Array<{ href: string; isInternal: boolean }> | { internal: string[]; external: string[] };
  loadTimeMs?: number;
  htmlSize?: number;
  schemaMarkup?: unknown[];
  rawHtml?: string;
  textContent?: string;
}

export interface AnalysisResult {
  seoScore: number;
  aioScore: number;
  combinedScore: number;
  
  seo: {
    score: number;
    breakdown: {
      technicalScore: number;
      contentScore: number;
      metaScore: number;
      performanceScore: number;
      accessibilityScore: number;
    };
    details: SEOBreakdown;
    issueCount: {
      critical: number;
      warning: number;
    };
    recommendations: string[];
  };
  
  aio: {
    score: number;
    breakdown: {
      structureScore: number;
      authorityScore: number;
      schemaScore: number;
      contentQualityScore: number;
      quotabilityScore: number;
    };
    details: AIOBreakdown;
    factors: {
      hasDirectAnswers: boolean;
      hasFAQSection: boolean;
      hasSchema: boolean;
      hasAuthorInfo: boolean;
      hasCitations: boolean;
      hasKeyTakeaways: boolean;
      avgSentenceLength: number;
    };
    recommendations: string[];
  };
  
  pageInfo: {
    wordCount: number;
    hasH1: boolean;
    hasMetaDescription: boolean;
    schemaTypes: string[];
  };
}

// ============================================
// SEO SCORING (100 points total)
// ============================================

export function analyzeSEO(page: PageInput): SEOBreakdown {
  const breakdown: SEOBreakdown = {
    technical: [],
    content: [],
    meta: [],
    performance: [],
    accessibility: [],
  };

  // Normalize links to array format
  const internalLinks = Array.isArray(page.links) 
    ? page.links.filter(l => l.isInternal).map(l => l.href)
    : (page.links?.internal || []);

  // ============================================
  // TECHNICAL (0-20 points)
  // ============================================

  // HTTPS check (5 points)
  const isHttps = page.url.startsWith("https://");
  breakdown.technical.push({
    name: "HTTPS Enabled",
    score: isHttps ? 5 : 0,
    maxScore: 5,
    status: isHttps ? "pass" : "fail",
    reason: isHttps 
      ? "Your site uses secure HTTPS connection"
      : "Your site is not using HTTPS, which is required for security and SEO",
    howToFix: isHttps ? undefined : "Install an SSL certificate and redirect HTTP to HTTPS",
  });

  // Schema markup (5 points)
  const hasSchema = (page.schemaMarkup && page.schemaMarkup.length > 0) || 
                    (page.rawHtml && /application\/ld\+json/i.test(page.rawHtml));
  breakdown.technical.push({
    name: "Schema Markup",
    score: hasSchema ? 5 : 0,
    maxScore: 5,
    status: hasSchema ? "pass" : "fail",
    reason: hasSchema 
      ? "Structured data (Schema.org) detected on your page"
      : "No structured data found - this helps search engines understand your content",
    howToFix: hasSchema ? undefined : "Add JSON-LD schema markup (Article, FAQ, HowTo, etc.)",
  });

  // Internal links (5 points)
  const internalLinkCount = internalLinks.length;
  const hasGoodInternalLinks = internalLinkCount >= 3;
  breakdown.technical.push({
    name: "Internal Linking",
    score: hasGoodInternalLinks ? 5 : Math.min(internalLinkCount, 4),
    maxScore: 5,
    status: hasGoodInternalLinks ? "pass" : internalLinkCount > 0 ? "warning" : "fail",
    reason: hasGoodInternalLinks 
      ? `Good internal linking structure (${internalLinkCount} internal links)`
      : `Only ${internalLinkCount} internal links found - more helps SEO and user navigation`,
    howToFix: hasGoodInternalLinks ? undefined : "Add links to related pages on your site",
  });

  // Canonical tag (5 points)
  const hasCanonical = page.rawHtml ? /<link[^>]+rel=["']canonical["']/i.test(page.rawHtml) : false;
  breakdown.technical.push({
    name: "Canonical Tag",
    score: hasCanonical ? 5 : 0,
    maxScore: 5,
    status: hasCanonical ? "pass" : "warning",
    reason: hasCanonical 
      ? "Canonical URL is properly set"
      : "No canonical tag found - helps prevent duplicate content issues",
    howToFix: hasCanonical ? undefined : "Add <link rel='canonical' href='...'> in your <head>",
  });

  // ============================================
  // CONTENT (0-20 points)
  // ============================================

  // H1 heading (5 points)
  const h1Count = page.h1?.length || 0;
  const h1Status = h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warning";
  breakdown.content.push({
    name: "H1 Heading",
    score: h1Count === 1 ? 5 : h1Count > 1 ? 3 : 0,
    maxScore: 5,
    status: h1Status,
    reason: h1Count === 1 
      ? "Page has exactly one H1 heading"
      : h1Count === 0 
        ? "Missing H1 heading - every page needs a main heading"
        : `${h1Count} H1 headings found - should have exactly one`,
    howToFix: h1Status === "pass" ? undefined : h1Count === 0 
      ? "Add a descriptive H1 heading to your page"
      : "Keep only one H1 and convert others to H2",
  });

  // H2 subheadings (3 points)
  const h2Count = page.h2?.length || 0;
  const hasH2s = h2Count >= 2;
  breakdown.content.push({
    name: "Subheadings (H2)",
    score: hasH2s ? 3 : h2Count === 1 ? 2 : 0,
    maxScore: 3,
    status: hasH2s ? "pass" : h2Count > 0 ? "warning" : "fail",
    reason: hasH2s 
      ? `${h2Count} H2 subheadings found - good content structure`
      : `Only ${h2Count} H2 headings - use more to organize content`,
    howToFix: hasH2s ? undefined : "Break content into sections with H2 headings",
  });

  // Word count (7 points)
  const wordCount = page.wordCount || 0;
  let wordScore = 0;
  let wordStatus: "pass" | "warning" | "fail" = "fail";
  if (wordCount >= 1500) { wordScore = 7; wordStatus = "pass"; }
  else if (wordCount >= 800) { wordScore = 5; wordStatus = "pass"; }
  else if (wordCount >= 300) { wordScore = 3; wordStatus = "warning"; }
  else if (wordCount >= 100) { wordScore = 1; wordStatus = "warning"; }
  
  breakdown.content.push({
    name: "Content Length",
    score: wordScore,
    maxScore: 7,
    status: wordStatus,
    reason: wordCount >= 800 
      ? `${wordCount} words - comprehensive content length`
      : wordCount >= 300 
        ? `${wordCount} words - consider adding more depth`
        : `Only ${wordCount} words - thin content hurts rankings`,
    howToFix: wordStatus === "pass" ? undefined : "Expand content to at least 800 words with valuable information",
  });

  // Keyword in H1 (5 points)
  const titleWords = (page.title || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const h1Text = (page.h1?.[0] || "").toLowerCase();
  const hasKeywordMatch = titleWords.some(word => h1Text.includes(word));
  breakdown.content.push({
    name: "Keyword in H1",
    score: hasKeywordMatch ? 5 : 0,
    maxScore: 5,
    status: hasKeywordMatch ? "pass" : "warning",
    reason: hasKeywordMatch 
      ? "Title keywords appear in H1 heading"
      : "H1 doesn't reflect title keywords - important for relevance",
    howToFix: hasKeywordMatch ? undefined : "Include your main keyword in both title and H1",
  });

  // ============================================
  // META (0-20 points)
  // ============================================

  // Title tag (8 points)
  const title = page.title || "";
  const titleLength = title.length;
  let titleScore = 0;
  let titleStatus: "pass" | "warning" | "fail" = "fail";
  if (titleLength >= 50 && titleLength <= 60) { titleScore = 8; titleStatus = "pass"; }
  else if (titleLength >= 30 && titleLength <= 70) { titleScore = 6; titleStatus = "warning"; }
  else if (titleLength > 0) { titleScore = 3; titleStatus = "warning"; }

  breakdown.meta.push({
    name: "Title Tag",
    score: titleScore,
    maxScore: 8,
    status: titleStatus,
    reason: titleLength === 0 
      ? "Missing title tag - critical for SEO"
      : titleLength >= 50 && titleLength <= 60 
        ? `Title is ${titleLength} chars - optimal length`
        : `Title is ${titleLength} chars - aim for 50-60 characters`,
    howToFix: titleStatus === "pass" ? undefined : "Write a compelling title between 50-60 characters",
  });

  // Meta description (8 points)
  const desc = page.metaDescription || "";
  const descLength = desc.length;
  let descScore = 0;
  let descStatus: "pass" | "warning" | "fail" = "fail";
  if (descLength >= 120 && descLength <= 160) { descScore = 8; descStatus = "pass"; }
  else if (descLength >= 70 && descLength <= 180) { descScore = 5; descStatus = "warning"; }
  else if (descLength > 0) { descScore = 2; descStatus = "warning"; }

  breakdown.meta.push({
    name: "Meta Description",
    score: descScore,
    maxScore: 8,
    status: descStatus,
    reason: descLength === 0 
      ? "Missing meta description - important for click-through rates"
      : descLength >= 120 && descLength <= 160 
        ? `Description is ${descLength} chars - optimal`
        : `Description is ${descLength} chars - aim for 120-160 characters`,
    howToFix: descStatus === "pass" ? undefined : "Write a compelling description between 120-160 characters",
  });

  // Open Graph (4 points)
  const hasOG = page.rawHtml ? /<meta[^>]+property=["']og:/i.test(page.rawHtml) : false;
  breakdown.meta.push({
    name: "Open Graph Tags",
    score: hasOG ? 4 : 0,
    maxScore: 4,
    status: hasOG ? "pass" : "warning",
    reason: hasOG 
      ? "Open Graph tags present for social sharing"
      : "Missing Open Graph tags - affects social media previews",
    howToFix: hasOG ? undefined : "Add og:title, og:description, og:image meta tags",
  });

  // ============================================
  // PERFORMANCE (0-20 points)
  // ============================================

  // Load time (10 points)
  const loadTime = page.loadTimeMs || 0;
  let loadScore = 0;
  let loadStatus: "pass" | "warning" | "fail" = "fail";
  if (loadTime <= 1000) { loadScore = 10; loadStatus = "pass"; }
  else if (loadTime <= 2000) { loadScore = 8; loadStatus = "pass"; }
  else if (loadTime <= 3000) { loadScore = 5; loadStatus = "warning"; }
  else if (loadTime <= 5000) { loadScore = 2; loadStatus = "warning"; }

  breakdown.performance.push({
    name: "Page Load Time",
    score: loadScore,
    maxScore: 10,
    status: loadStatus,
    reason: loadTime <= 2000 
      ? `Fast load time (${loadTime}ms)`
      : loadTime > 0 
        ? `Slow load time (${loadTime}ms) - aim for under 2 seconds`
        : "Load time not measured",
    howToFix: loadStatus === "pass" ? undefined : "Optimize images, enable caching, minify CSS/JS",
  });

  // HTML size (5 points)
  const htmlSize = page.htmlSize || 0;
  const htmlSizeKb = Math.round(htmlSize / 1024);
  const htmlOk = htmlSizeKb <= 100 || htmlSize === 0;
  breakdown.performance.push({
    name: "Page Size",
    score: htmlOk ? 5 : htmlSizeKb <= 200 ? 3 : 1,
    maxScore: 5,
    status: htmlOk ? "pass" : htmlSizeKb <= 200 ? "warning" : "fail",
    reason: htmlSize === 0 
      ? "Page size not measured"
      : htmlOk 
        ? `Page size is ${htmlSizeKb}KB - good`
        : `Page size is ${htmlSizeKb}KB - consider reducing`,
    howToFix: htmlOk ? undefined : "Compress images, remove unused code, lazy load content",
  });

  // Mobile viewport (5 points)
  const hasViewport = page.rawHtml ? /<meta[^>]+name=["']viewport["']/i.test(page.rawHtml) : false;
  breakdown.performance.push({
    name: "Mobile Viewport",
    score: hasViewport ? 5 : 0,
    maxScore: 5,
    status: hasViewport ? "pass" : "fail",
    reason: hasViewport 
      ? "Mobile viewport meta tag is set"
      : "Missing viewport tag - required for mobile responsiveness",
    howToFix: hasViewport ? undefined : "Add <meta name='viewport' content='width=device-width, initial-scale=1'>",
  });

  // ============================================
  // ACCESSIBILITY (0-20 points)
  // ============================================

  // Image alt texts (10 points)
  const images = page.images || [];
  const imagesWithAlt = images.filter(img => img.alt && img.alt.trim().length > 0).length;
  const totalImages = images.length;
  const altRatio = totalImages > 0 ? imagesWithAlt / totalImages : 1;
  const altScore = Math.round(altRatio * 10);
  const altStatus: "pass" | "warning" | "fail" = altRatio >= 0.9 ? "pass" : altRatio >= 0.5 ? "warning" : "fail";
  
  breakdown.accessibility.push({
    name: "Image Alt Text",
    score: altScore,
    maxScore: 10,
    status: totalImages === 0 ? "pass" : altStatus,
    reason: totalImages === 0 
      ? "No images to check"
      : altRatio >= 0.9 
        ? `${imagesWithAlt}/${totalImages} images have alt text`
        : `Only ${imagesWithAlt}/${totalImages} images have alt text - important for accessibility`,
    howToFix: altStatus === "pass" || totalImages === 0 ? undefined : "Add descriptive alt text to all images",
  });

  // Language attribute (5 points)
  const hasLang = page.rawHtml ? /<html[^>]+lang=/i.test(page.rawHtml) : false;
  breakdown.accessibility.push({
    name: "Language Attribute",
    score: hasLang ? 5 : 0,
    maxScore: 5,
    status: hasLang ? "pass" : "warning",
    reason: hasLang 
      ? "HTML lang attribute is set"
      : "Missing lang attribute on <html> tag",
    howToFix: hasLang ? undefined : "Add lang='en' (or appropriate language) to your <html> tag",
  });

  // ARIA (5 points)
  const hasAria = page.rawHtml ? /aria-|role=["']/i.test(page.rawHtml) : false;
  breakdown.accessibility.push({
    name: "ARIA/Accessibility",
    score: hasAria ? 5 : 0,
    maxScore: 5,
    status: hasAria ? "pass" : "warning",
    reason: hasAria 
      ? "ARIA attributes detected for accessibility"
      : "No ARIA landmarks found - helps screen readers navigate",
    howToFix: hasAria ? undefined : "Add role='main', role='navigation' and aria-label attributes",
  });
  
  return breakdown;
}

// ============================================
// AIO SCORING (100 points total)
// ============================================

export function analyzeAIO(page: PageInput): AIOBreakdown {
  const breakdown: AIOBreakdown = {
    structure: [],
    authority: [],
    schema: [],
    contentQuality: [],
    quotability: [],
  };

  const html = page.rawHtml || "";
  const text = page.textContent || "";
  const lowerText = text.toLowerCase();

  // ============================================
  // STRUCTURE (0-20 points) - How AI extracts content
  // ============================================

  // Direct answers (5 points)
  const hasDirectAnswers = /^[A-Z][^.!?]*(?:is|are|refers to|means|involves)[^.!?]*[.!?]/m.test(text);
  breakdown.structure.push({
    name: "Direct Answers",
    score: hasDirectAnswers ? 5 : 0,
    maxScore: 5,
    status: hasDirectAnswers ? "pass" : "fail",
    reason: hasDirectAnswers 
      ? "Content starts with clear, direct answers"
      : "No direct answer statements found at start",
    howToFix: "Start with 'X is...' or 'X refers to...' definitions that AI can quote",
  });

  // FAQ section (4 points)
  const hasFAQ = /faq|frequently\s+asked|common\s+questions/i.test(text);
  breakdown.structure.push({
    name: "FAQ Section",
    score: hasFAQ ? 4 : 0,
    maxScore: 4,
    status: hasFAQ ? "pass" : "fail",
    reason: hasFAQ 
      ? "FAQ section detected - great for AI extraction"
      : "No FAQ section found - AI loves Q&A format",
    howToFix: "Add a 'Frequently Asked Questions' section with common queries",
  });

  // Lists & steps (4 points)
  const hasLists = /<ul[^>]*>|<ol[^>]*>/i.test(html);
  breakdown.structure.push({
    name: "Lists & Steps",
    score: hasLists ? 4 : 0,
    maxScore: 4,
    status: hasLists ? "pass" : "fail",
    reason: hasLists 
      ? "Bulleted/numbered lists found - easy AI extraction"
      : "No structured lists - add bullet points for key info",
    howToFix: "Use <ul> or <ol> lists to organize key points",
  });

  // Tables (3 points)
  const hasTables = /<table[^>]*>/i.test(html);
  breakdown.structure.push({
    name: "Data Tables",
    score: hasTables ? 3 : 0,
    maxScore: 3,
    status: hasTables ? "pass" : "warning",
    reason: hasTables 
      ? "Data tables present - great for comparisons"
      : "No tables found - useful for comparing data",
    howToFix: "Add comparison tables where relevant",
  });

  // Key takeaways (4 points)
  const hasTakeaways = /key\s+takeaways?|summary|in\s+(?:summary|conclusion)|tl;?dr/i.test(lowerText);
  breakdown.structure.push({
    name: "Key Takeaways",
    score: hasTakeaways ? 4 : 0,
    maxScore: 4,
    status: hasTakeaways ? "pass" : "fail",
    reason: hasTakeaways 
      ? "Summary/takeaways section found"
      : "No key takeaways - AI loves quick summaries",
    howToFix: "Add a 'Key Takeaways' or 'Summary' section at top or bottom",
  });

  // ============================================
  // AUTHORITY (0-20 points) - Trust signals
  // ============================================

  // Author info (5 points)
  const hasAuthor = /author|written\s+by|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test(html);
  breakdown.authority.push({
    name: "Author Information",
    score: hasAuthor ? 5 : 0,
    maxScore: 5,
    status: hasAuthor ? "pass" : "fail",
    reason: hasAuthor 
      ? "Author attribution found"
      : "No author info - hurts E-E-A-T signals",
    howToFix: "Add author name, bio, and credentials to your content",
  });

  // Citations/sources (5 points)
  const hasCitations = /\[[0-9]+\]|\(source\)|according\s+to\s+[A-Z]|cited|reference/i.test(text);
  breakdown.authority.push({
    name: "Citations & Sources",
    score: hasCitations ? 5 : 0,
    maxScore: 5,
    status: hasCitations ? "pass" : "fail",
    reason: hasCitations 
      ? "Citations or source references found"
      : "No citations - AI trusts sourced content more",
    howToFix: "Cite authoritative sources with 'According to [Source]...'",
  });

  // Publish date (3 points)
  const hasPublishDate = /publish(?:ed)?[\s:-]+\d{4}|date[\s:-]+\d{4}/i.test(html);
  breakdown.authority.push({
    name: "Publish Date",
    score: hasPublishDate ? 3 : 0,
    maxScore: 3,
    status: hasPublishDate ? "pass" : "warning",
    reason: hasPublishDate 
      ? "Publication date is visible"
      : "No publish date - shows content freshness",
    howToFix: "Display the publication date clearly on the page",
  });

  // Updated date (4 points)
  const hasUpdateDate = /updat(?:ed)?[\s:-]+\d{4}|last\s+(?:updated|modified)/i.test(html);
  breakdown.authority.push({
    name: "Last Updated",
    score: hasUpdateDate ? 4 : 0,
    maxScore: 4,
    status: hasUpdateDate ? "pass" : "warning",
    reason: hasUpdateDate 
      ? "Last updated date shown"
      : "No update date - shows content is maintained",
    howToFix: "Add 'Last updated: [date]' to your content",
  });

  // Expert quotes (3 points)
  const hasQuotes = /"[^"]{20,}"[^"]*(?:said|says|according\s+to|notes)/i.test(text);
  breakdown.authority.push({
    name: "Expert Quotes",
    score: hasQuotes ? 3 : 0,
    maxScore: 3,
    status: hasQuotes ? "pass" : "warning",
    reason: hasQuotes 
      ? "Expert quotes detected"
      : "No expert quotes - adds credibility",
    howToFix: "Include quotes from industry experts with attribution",
  });

  // ============================================
  // SCHEMA (0-20 points) - Structured data
  // ============================================

  const hasSchemaMarkup = /application\/ld\+json/i.test(html);
  const hasFAQSchema = /FAQPage/i.test(html);
  const hasHowToSchema = /HowTo/i.test(html);
  const hasArticleSchema = /Article|NewsArticle|BlogPosting/i.test(html);

  breakdown.schema.push({
    name: "JSON-LD Present",
    score: hasSchemaMarkup ? 5 : 0,
    maxScore: 5,
    status: hasSchemaMarkup ? "pass" : "fail",
    reason: hasSchemaMarkup 
      ? "Structured data (JSON-LD) detected"
      : "No structured data - critical for AI visibility",
    howToFix: "Add JSON-LD structured data to your page",
  });

  breakdown.schema.push({
    name: "FAQ Schema",
    score: hasFAQSchema ? 5 : 0,
    maxScore: 5,
    status: hasFAQSchema ? "pass" : "fail",
    reason: hasFAQSchema 
      ? "FAQ schema markup present"
      : "No FAQ schema - huge boost for AI citations",
    howToFix: "Add FAQPage schema with your Q&A content",
  });

  breakdown.schema.push({
    name: "HowTo Schema",
    score: hasHowToSchema ? 5 : 0,
    maxScore: 5,
    status: hasHowToSchema ? "pass" : "warning",
    reason: hasHowToSchema 
      ? "HowTo schema detected"
      : "No HowTo schema - add for step-by-step content",
    howToFix: "Add HowTo schema for instructional content",
  });

  breakdown.schema.push({
    name: "Article Schema",
    score: hasArticleSchema ? 5 : 0,
    maxScore: 5,
    status: hasArticleSchema ? "pass" : "warning",
    reason: hasArticleSchema 
      ? "Article schema present"
      : "No Article schema - helps categorize content",
    howToFix: "Add Article or BlogPosting schema",
  });

  // ============================================
  // CONTENT QUALITY (0-20 points)
  // ============================================

  // Definitions (5 points)
  const hasDefinitions = /(?:is\s+(?:a|an|the)|refers\s+to|means|defined\s+as)/i.test(text);
  breakdown.contentQuality.push({
    name: "Definitions",
    score: hasDefinitions ? 5 : 0,
    maxScore: 5,
    status: hasDefinitions ? "pass" : "fail",
    reason: hasDefinitions 
      ? "Clear definitions found - AI loves to cite these"
      : "No 'X is...' definitions - AI can't extract definitions",
    howToFix: "Include 'X is...' or 'X refers to...' definitions",
  });

  // Statistics (5 points)
  const hasStats = /\d+(?:\.\d+)?%|\d+\s+(?:million|billion|thousand)|data\s+shows/i.test(text);
  breakdown.contentQuality.push({
    name: "Statistics & Data",
    score: hasStats ? 5 : 0,
    maxScore: 5,
    status: hasStats ? "pass" : "warning",
    reason: hasStats 
      ? "Statistics and data points found"
      : "No statistics - specific numbers are highly citable",
    howToFix: "Include specific statistics, percentages, or data points",
  });

  // Comparisons (4 points)
  const hasComparisons = /\bvs\.?\b|versus|compared\s+to|difference\s+between/i.test(text);
  breakdown.contentQuality.push({
    name: "Comparisons",
    score: hasComparisons ? 4 : 0,
    maxScore: 4,
    status: hasComparisons ? "pass" : "warning",
    reason: hasComparisons 
      ? "Comparison content detected"
      : "No comparisons - 'X vs Y' content is popular",
    howToFix: "Add comparison sections or 'X vs Y' content",
  });

  // Original insights (6 points)
  const hasInsights = /our\s+(?:research|analysis|findings)|we\s+(?:found|discovered|analyzed)/i.test(lowerText);
  breakdown.contentQuality.push({
    name: "Original Research",
    score: hasInsights ? 6 : 0,
    maxScore: 6,
    status: hasInsights ? "pass" : "warning",
    reason: hasInsights 
      ? "Original research/analysis mentioned"
      : "No original insights - unique data is more citable",
    howToFix: "Include your own research, analysis, or unique findings",
  });

  // ============================================
  // QUOTABILITY (0-20 points)
  // ============================================

  // Sentence analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length 
    : 0;
  
  // Quotable snippets (6 points)
  const quotableCount = sentences.filter(s => {
    const words = s.split(/\s+/).length;
    return words >= 15 && words <= 60;
  }).length;
  const hasQuotable = quotableCount >= 3;
  breakdown.quotability.push({
    name: "Quotable Snippets",
    score: hasQuotable ? 6 : Math.min(quotableCount * 2, 5),
    maxScore: 6,
    status: hasQuotable ? "pass" : quotableCount > 0 ? "warning" : "fail",
    reason: hasQuotable 
      ? `${quotableCount} quotable sentences found (15-60 words)`
      : `Only ${quotableCount} quotable sentences - need standalone quotes`,
    howToFix: "Write self-contained sentences that can stand alone as quotes",
  });

  // Sentence brevity (6 points)
  let brevityScore = 0;
  let brevityStatus: "pass" | "warning" | "fail" = "fail";
  if (avgSentenceLength <= 15) { brevityScore = 6; brevityStatus = "pass"; }
  else if (avgSentenceLength <= 20) { brevityScore = 5; brevityStatus = "pass"; }
  else if (avgSentenceLength <= 25) { brevityScore = 3; brevityStatus = "warning"; }
  else if (avgSentenceLength <= 35) { brevityScore = 1; brevityStatus = "warning"; }

  breakdown.quotability.push({
    name: "Sentence Brevity",
    score: brevityScore,
    maxScore: 6,
    status: brevityStatus,
    reason: avgSentenceLength <= 20 
      ? `Average ${Math.round(avgSentenceLength)} words/sentence - good for AI`
      : `Average ${Math.round(avgSentenceLength)} words/sentence - too long for AI`,
    howToFix: brevityStatus === "pass" ? undefined : "Shorten sentences to under 20 words on average",
  });

  // First paragraph quality (5 points)
  const firstPara = sentences.slice(0, 3).join(". ");
  const hasGoodIntro = firstPara.length >= 100 && /(?:is|are|means|refers)/i.test(firstPara);
  breakdown.quotability.push({
    name: "Strong Opening",
    score: hasGoodIntro ? 5 : 0,
    maxScore: 5,
    status: hasGoodIntro ? "pass" : "warning",
    reason: hasGoodIntro 
      ? "First paragraph is AI-friendly"
      : "Opening doesn't have extractable definitions",
    howToFix: "Start with a clear, definition-style answer in first paragraph",
  });

  // Scannable format (3 points)
  const hasBoldOrEmphasis = /<(?:strong|b|em)>/i.test(html);
  breakdown.quotability.push({
    name: "Scannable Format",
    score: hasBoldOrEmphasis ? 3 : 0,
    maxScore: 3,
    status: hasBoldOrEmphasis ? "pass" : "warning",
    reason: hasBoldOrEmphasis 
      ? "Uses bold/emphasis for key points"
      : "No text emphasis - highlight key terms",
    howToFix: "Bold important terms and key phrases",
  });
  
  return breakdown;
}

// ============================================
// SCORE CALCULATION
// ============================================

export function calculateCategoryScore(items: ScoreItem[]): number {
  const total = items.reduce((sum, item) => sum + item.score, 0);
  const max = items.reduce((sum, item) => sum + item.maxScore, 0);
  return max > 0 ? Math.round((total / max) * 20) : 0;
}

export function calculateTotalScore(breakdown: SEOBreakdown | AIOBreakdown): number {
  const allItems = Object.values(breakdown).flat();
  const total = allItems.reduce((sum, item) => sum + item.score, 0);
  const max = allItems.reduce((sum, item) => sum + item.maxScore, 0);
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

export function getTopRecommendations(breakdown: SEOBreakdown | AIOBreakdown, limit: number = 5): string[] {
  const allItems = Object.values(breakdown).flat();
  return allItems
    .filter(item => item.status !== "pass" && item.howToFix)
    .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score))
    .slice(0, limit)
    .map(item => item.howToFix!);
}

// ============================================
// UNIFIED ANALYSIS FUNCTION
// ============================================

export function analyzePageUnified(page: PageInput): AnalysisResult {
  // Run both analyses
  const seoBreakdown = analyzeSEO(page);
  const aioBreakdown = analyzeAIO(page);
  
  // Calculate scores
  const seoScore = calculateTotalScore(seoBreakdown);
  const aioScore = calculateTotalScore(aioBreakdown);
  
  // Calculate category scores
  const seoCategoryScores = {
    technicalScore: calculateCategoryScore(seoBreakdown.technical),
    contentScore: calculateCategoryScore(seoBreakdown.content),
    metaScore: calculateCategoryScore(seoBreakdown.meta),
    performanceScore: calculateCategoryScore(seoBreakdown.performance),
    accessibilityScore: calculateCategoryScore(seoBreakdown.accessibility),
  };

  const aioCategoryScores = {
    structureScore: calculateCategoryScore(aioBreakdown.structure),
    authorityScore: calculateCategoryScore(aioBreakdown.authority),
    schemaScore: calculateCategoryScore(aioBreakdown.schema),
    contentQualityScore: calculateCategoryScore(aioBreakdown.contentQuality),
    quotabilityScore: calculateCategoryScore(aioBreakdown.quotability),
  };

  // Count issues
  const allSeoItems = Object.values(seoBreakdown).flat();
  const issueCount = {
    critical: allSeoItems.filter(i => i.status === "fail").length,
    warning: allSeoItems.filter(i => i.status === "warning").length,
  };

  // Get AIO factors
  const aioFactors = {
    hasDirectAnswers: aioBreakdown.structure.find(i => i.name === "Direct Answers")?.status === "pass",
    hasFAQSection: aioBreakdown.structure.find(i => i.name === "FAQ Section")?.status === "pass",
    hasSchema: aioBreakdown.schema.find(i => i.name === "JSON-LD Present")?.status === "pass",
    hasAuthorInfo: aioBreakdown.authority.find(i => i.name === "Author Information")?.status === "pass",
    hasCitations: aioBreakdown.authority.find(i => i.name === "Citations & Sources")?.status === "pass",
    hasKeyTakeaways: aioBreakdown.structure.find(i => i.name === "Key Takeaways")?.status === "pass",
    avgSentenceLength: Math.round(
      parseFloat((aioBreakdown.quotability.find(i => i.name === "Sentence Brevity")?.reason.match(/\d+/) || ["20"])[0])
    ),
  };

  return {
    seoScore,
    aioScore,
    combinedScore: Math.round((seoScore + aioScore) / 2),
    
    seo: {
      score: seoScore,
      breakdown: seoCategoryScores,
      details: seoBreakdown,
      issueCount,
      recommendations: getTopRecommendations(seoBreakdown),
    },
    
    aio: {
      score: aioScore,
      breakdown: aioCategoryScores,
      details: aioBreakdown,
      factors: aioFactors,
      recommendations: getTopRecommendations(aioBreakdown),
    },
    
    pageInfo: {
      wordCount: page.wordCount || 0,
      hasH1: (page.h1?.length || 0) > 0,
      hasMetaDescription: !!page.metaDescription,
      schemaTypes: (page.schemaMarkup as Array<{ "@type"?: string }> || [])
        .map(s => s["@type"])
        .filter((t): t is string => Boolean(t)),
    },
  };
}

/**
 * Analyze multiple pages and return aggregate scores
 */
export function analyzeMultiplePages(pages: PageInput[]): {
  seoScore: number;
  aioScore: number;
  combinedScore: number;
  pagesAnalyzed: number;
  issues: { critical: number; warnings: number; passed: number };
  topSeoFixes: string[];
  topAioFixes: string[];
} {
  if (pages.length === 0) {
    return {
      seoScore: 0,
      aioScore: 0,
      combinedScore: 0,
      pagesAnalyzed: 0,
      issues: { critical: 0, warnings: 0, passed: 0 },
      topSeoFixes: [],
      topAioFixes: [],
    };
  }

  // Analyze all pages
  const results = pages.map(page => analyzePageUnified(page));
  
  // Calculate average scores
  const avgSeoScore = Math.round(results.reduce((sum, r) => sum + r.seoScore, 0) / results.length);
  const avgAioScore = Math.round(results.reduce((sum, r) => sum + r.aioScore, 0) / results.length);
  
  // Aggregate issues
  const totalCritical = results.reduce((sum, r) => sum + r.seo.issueCount.critical, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.seo.issueCount.warning, 0);
  const totalPassed = results.reduce((sum, r) => {
    const allItems = Object.values(r.seo.details).flat();
    return sum + allItems.filter(i => i.status === "pass").length;
  }, 0);
  
  // Collect all recommendations and dedupe
  const allSeoRecs = [...new Set(results.flatMap(r => r.seo.recommendations))];
  const allAioRecs = [...new Set(results.flatMap(r => r.aio.recommendations))];
  
  return {
    seoScore: avgSeoScore,
    aioScore: avgAioScore,
    combinedScore: Math.round((avgSeoScore + avgAioScore) / 2),
    pagesAnalyzed: pages.length,
    issues: {
      critical: totalCritical,
      warnings: totalWarnings,
      passed: totalPassed,
    },
    topSeoFixes: allSeoRecs.slice(0, 5),
    topAioFixes: allAioRecs.slice(0, 5),
  };
}

