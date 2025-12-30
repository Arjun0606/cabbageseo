/**
 * GEO (Generative Engine Optimization) Checklist
 * 
 * Based on research from:
 * - Google's AI Search guidelines
 * - Industry GEO best practices
 * - Platform-specific optimization strategies
 */

export interface GEOCheckItem {
  id: string;
  category: "structure" | "content" | "technical" | "platform";
  title: string;
  description: string;
  howToFix: string;
  impact: "high" | "medium" | "low";
  platforms: ("chatgpt" | "perplexity" | "google_aio")[];
  automated: boolean; // Can we detect this automatically?
}

/**
 * Core GEO optimization strategies
 */
export const GEO_CHECKLIST: GEOCheckItem[] = [
  // ============================================
  // STRUCTURE & SCHEMA (Critical for AI parsing)
  // ============================================
  {
    id: "faq-schema",
    category: "structure",
    title: "FAQ Schema Markup",
    description: "Use FAQPage schema to help AI engines understand Q&A content",
    howToFix: "Add FAQPage structured data markup to pages with question-answer content. Each FAQ should have @type: Question and @type: Answer.",
    impact: "high",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "article-schema",
    category: "structure",
    title: "Article Schema Markup",
    description: "Use Article schema with author, datePublished, and dateModified",
    howToFix: "Add Article or BlogPosting structured data with complete author information, publication dates, and headline.",
    impact: "high",
    platforms: ["perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "organization-schema",
    category: "structure",
    title: "Organization Schema",
    description: "Establish entity identity with Organization schema and sameAs links",
    howToFix: "Add Organization schema with name, logo, URL, and sameAs links to Wikipedia, Wikidata, and social profiles.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "breadcrumb-schema",
    category: "structure",
    title: "Breadcrumb Schema",
    description: "Help AI understand site hierarchy with breadcrumb markup",
    howToFix: "Add BreadcrumbList structured data showing the page's position in the site hierarchy.",
    impact: "low",
    platforms: ["google_aio"],
    automated: true,
  },
  {
    id: "how-to-schema",
    category: "structure",
    title: "HowTo Schema for Tutorials",
    description: "Use HowTo schema for step-by-step instructions",
    howToFix: "For tutorial content, add HowTo structured data with steps, tools, and estimated time.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },

  // ============================================
  // CONTENT OPTIMIZATION (For AI citation)
  // ============================================
  {
    id: "direct-answers",
    category: "content",
    title: "Direct Answer in First Sentences",
    description: "Place concise, accurate answers within the first few sentences of sections",
    howToFix: "Start each section with a 1-2 sentence direct answer to the section's question before elaborating with details.",
    impact: "high",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: false,
  },
  {
    id: "conversational-queries",
    category: "content",
    title: "Target Conversational Queries",
    description: "Structure content around natural 'how to', 'what is', 'why' questions",
    howToFix: "Include H2/H3 headings phrased as questions that users might ask AI assistants. Example: 'What is the best way to...'",
    impact: "high",
    platforms: ["chatgpt", "perplexity"],
    automated: true,
  },
  {
    id: "clear-definitions",
    category: "content",
    title: "Include Clear Definitions",
    description: "Provide concise definitions for key terms and concepts",
    howToFix: "Define important terms clearly: 'X is a [definition].' Make definitions quotable and standalone.",
    impact: "high",
    platforms: ["chatgpt", "perplexity"],
    automated: false,
  },
  {
    id: "statistics-sources",
    category: "content",
    title: "Include Statistics with Sources",
    description: "Include verifiable statistics with citations to increase authority",
    howToFix: "Add specific statistics and data points with source attribution. Example: 'According to [Source], 75% of users...'",
    impact: "high",
    platforms: ["perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "bullet-lists",
    category: "content",
    title: "Use Bullet Points and Lists",
    description: "Format key information as scannable lists",
    howToFix: "Break down complex information into bullet points and numbered lists. AI engines prefer structured, scannable content.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "tables",
    category: "content",
    title: "Use Tables for Comparisons",
    description: "Present comparative data in properly formatted tables",
    howToFix: "Use HTML tables with proper headers for comparing features, prices, or options. Tables are easily parsed by AI.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "content-freshness",
    category: "content",
    title: "Keep Content Fresh",
    description: "Regularly update information as AI prioritizes current data",
    howToFix: "Update content regularly, especially dates, statistics, and references. Add 'Last updated:' timestamps.",
    impact: "high",
    platforms: ["perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "topical-authority",
    category: "content",
    title: "Build Topical Authority",
    description: "Create comprehensive content clusters covering topics in-depth",
    howToFix: "Build content clusters with pillar pages and supporting articles. Cover topics thoroughly rather than surface-level.",
    impact: "high",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: false,
  },
  {
    id: "author-expertise",
    category: "content",
    title: "Show Author Expertise (E-E-A-T)",
    description: "Demonstrate Experience, Expertise, Authoritativeness, Trustworthiness",
    howToFix: "Include author bios with credentials, link to author's other work, add expert quotes and citations.",
    impact: "high",
    platforms: ["google_aio"],
    automated: true,
  },

  // ============================================
  // TECHNICAL REQUIREMENTS
  // ============================================
  {
    id: "crawlability",
    category: "technical",
    title: "Ensure AI Crawlability",
    description: "Allow AI crawlers in robots.txt and submit sitemaps",
    howToFix: "Check robots.txt allows GPTBot, PerplexityBot, and GoogleBot. Submit XML sitemap to Google Search Console.",
    impact: "high",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "page-speed",
    category: "technical",
    title: "Optimize Page Speed",
    description: "Fast-loading pages are favored by AI search",
    howToFix: "Aim for Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1. Optimize images, minimize JS.",
    impact: "medium",
    platforms: ["google_aio"],
    automated: true,
  },
  {
    id: "entity-linking",
    category: "technical",
    title: "Entity Linking (sameAs)",
    description: "Connect content to known entities like Wikipedia",
    howToFix: "Add sameAs links in schema to Wikipedia, Wikidata entries for your organization and key concepts.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "ssl-https",
    category: "technical",
    title: "HTTPS/SSL Encryption",
    description: "Secure sites are trusted more by AI engines",
    howToFix: "Ensure your site uses HTTPS with a valid SSL certificate.",
    impact: "medium",
    platforms: ["google_aio"],
    automated: true,
  },
  {
    id: "mobile-friendly",
    category: "technical",
    title: "Mobile-Friendly Design",
    description: "Responsive design for mobile AI search",
    howToFix: "Ensure site is responsive and passes Google's Mobile-Friendly Test.",
    impact: "medium",
    platforms: ["google_aio"],
    automated: true,
  },
  {
    id: "image-alt-text",
    category: "technical",
    title: "Descriptive Image Alt Text",
    description: "Help AI understand images with descriptive alt attributes",
    howToFix: "Add descriptive alt text to all images explaining what the image shows and its context.",
    impact: "medium",
    platforms: ["chatgpt", "perplexity", "google_aio"],
    automated: true,
  },
  {
    id: "video-transcripts",
    category: "technical",
    title: "Video Transcripts",
    description: "Provide transcripts for video content",
    howToFix: "Add full text transcripts below or alongside video content so AI can understand video content.",
    impact: "low",
    platforms: ["perplexity", "google_aio"],
    automated: false,
  },

  // ============================================
  // PLATFORM-SPECIFIC
  // ============================================
  {
    id: "chatgpt-concise",
    category: "platform",
    title: "ChatGPT: Concise Factual Content",
    description: "ChatGPT prefers concise, well-researched information",
    howToFix: "Write authoritative, fact-based content. Avoid fluff. Include citations and be specific.",
    impact: "high",
    platforms: ["chatgpt"],
    automated: false,
  },
  {
    id: "perplexity-citations",
    category: "platform",
    title: "Perplexity: Citation-Ready Content",
    description: "Perplexity heavily prioritizes citable, authoritative sources",
    howToFix: "Include specific data, quotes, and attributable statements. Link to primary sources.",
    impact: "high",
    platforms: ["perplexity"],
    automated: false,
  },
  {
    id: "google-eeat",
    category: "platform",
    title: "Google AI: E-E-A-T Signals",
    description: "Google AI Overviews emphasize E-E-A-T",
    howToFix: "Add author credentials, cite authoritative sources, show real experience with topic.",
    impact: "high",
    platforms: ["google_aio"],
    automated: false,
  },
];

/**
 * Get checklist items by category
 */
export function getChecklistByCategory(category: GEOCheckItem["category"]): GEOCheckItem[] {
  return GEO_CHECKLIST.filter(item => item.category === category);
}

/**
 * Get checklist items by platform
 */
export function getChecklistByPlatform(platform: GEOCheckItem["platforms"][number]): GEOCheckItem[] {
  return GEO_CHECKLIST.filter(item => item.platforms.includes(platform));
}

/**
 * Get high-impact items for quick wins
 */
export function getHighImpactItems(): GEOCheckItem[] {
  return GEO_CHECKLIST.filter(item => item.impact === "high");
}

/**
 * Get automated check items (can be detected programmatically)
 */
export function getAutomatedChecks(): GEOCheckItem[] {
  return GEO_CHECKLIST.filter(item => item.automated);
}

/**
 * Categories with descriptions
 */
export const GEO_CATEGORIES = {
  structure: {
    name: "Structure & Schema",
    description: "Structured data markup that helps AI parse your content",
    icon: "🏗️",
  },
  content: {
    name: "Content Optimization",
    description: "How to structure and write content for AI citation",
    icon: "✍️",
  },
  technical: {
    name: "Technical Requirements",
    description: "Technical factors that affect AI crawling and trust",
    icon: "⚙️",
  },
  platform: {
    name: "Platform-Specific",
    description: "Optimization tips for specific AI platforms",
    icon: "🎯",
  },
};

/**
 * Platform descriptions
 */
export const GEO_PLATFORMS = {
  chatgpt: {
    name: "ChatGPT",
    description: "Prefers concise, factual, authoritative content",
    icon: "🤖",
  },
  perplexity: {
    name: "Perplexity",
    description: "Focuses on citation-heavy, high-quality sources",
    icon: "🔮",
  },
  google_aio: {
    name: "Google AI Overviews",
    description: "Emphasizes E-E-A-T and structured content",
    icon: "🔍",
  },
};

