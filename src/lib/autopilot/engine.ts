/**
 * CabbageSEO Autopilot Engine
 * 
 * The magic orchestrator that:
 * 1. Takes a URL
 * 2. Discovers site structure
 * 3. Analyzes keywords & competitors
 * 4. Generates content strategy
 * 5. Creates optimized content
 * 6. Publishes automatically
 * 7. Monitors & iterates
 */

import { AIClient } from "@/lib/integrations/openai/client";
import { DataForSEOClient } from "@/lib/integrations/dataforseo/client";
import { WordPressClient } from "@/lib/integrations/wordpress/client";

export type AutopilotPhase = 
  | "discovery"
  | "analysis"
  | "strategy"
  | "generation"
  | "optimization"
  | "publishing"
  | "monitoring";

export interface AutopilotConfig {
  siteUrl: string;
  organizationId: string;
  siteId: string;
  
  // Optional CMS credentials
  wordpress?: {
    siteUrl: string;
    username: string;
    applicationPassword: string;
  };
  
  // Preferences
  autoPublish: boolean;
  contentTone: "professional" | "casual" | "technical" | "friendly";
  targetAudience: string;
  primaryLanguage: string;
  articlesPerWeek: number;
}

export interface DiscoveryResult {
  pages: Array<{
    url: string;
    title: string;
    type: "page" | "post" | "category" | "product";
    lastModified?: string;
  }>;
  sitemapUrls: string[];
  technologies: string[];
  estimatedPages: number;
}

export interface KeywordCluster {
  name: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    cpc: number;
  }>;
  priority: "high" | "medium" | "low";
  suggestedContentType: "guide" | "listicle" | "comparison" | "how-to" | "review";
}

export interface ContentPlan {
  clusters: KeywordCluster[];
  calendar: Array<{
    week: number;
    topics: Array<{
      clusterId: string;
      title: string;
      targetKeyword: string;
      estimatedWords: number;
      deadline: Date;
    }>;
  }>;
  totalArticles: number;
  estimatedTrafficPotential: number;
}

export interface AutopilotProgress {
  phase: AutopilotPhase;
  progress: number;
  message: string;
  details?: Record<string, unknown>;
}

type ProgressCallback = (progress: AutopilotProgress) => void;

/**
 * Main Autopilot Engine Class
 */
export class AutopilotEngine {
  private ai: AIClient;
  private dataforseo: DataForSEOClient;
  private wordpress?: WordPressClient;
  private config: AutopilotConfig;
  private onProgress?: ProgressCallback;

  constructor(config: AutopilotConfig, onProgress?: ProgressCallback) {
    this.config = config;
    this.onProgress = onProgress;
    
    this.ai = new AIClient();
    this.dataforseo = new DataForSEOClient();
    
    if (config.wordpress) {
      this.wordpress = new WordPressClient(config.wordpress);
    }
  }

  private reportProgress(phase: AutopilotPhase, progress: number, message: string, details?: Record<string, unknown>) {
    this.onProgress?.({
      phase,
      progress,
      message,
      details,
    });
  }

  /**
   * Phase 1: Discovery
   * Crawl the site, understand structure, find existing content
   */
  async discover(): Promise<DiscoveryResult> {
    this.reportProgress("discovery", 0, "Fetching sitemap...");
    
    const sitemapUrls = await this.fetchSitemap(this.config.siteUrl);
    this.reportProgress("discovery", 30, `Found ${sitemapUrls.length} URLs in sitemap`);
    
    // Crawl key pages to understand structure
    const pages: DiscoveryResult["pages"] = [];
    const samplesToFetch = Math.min(sitemapUrls.length, 50);
    
    for (let i = 0; i < samplesToFetch; i++) {
      const url = sitemapUrls[i];
      try {
        const pageData = await this.crawlPage(url);
        pages.push(pageData);
        
        const progress = 30 + (i / samplesToFetch) * 50;
        this.reportProgress("discovery", progress, `Crawled ${i + 1}/${samplesToFetch} pages`);
      } catch (error) {
        // Continue on error
      }
    }
    
    // Detect technologies
    const technologies = await this.detectTechnologies(this.config.siteUrl);
    
    this.reportProgress("discovery", 100, "Discovery complete", {
      pagesFound: pages.length,
      sitemapUrls: sitemapUrls.length,
    });
    
    return {
      pages,
      sitemapUrls,
      technologies,
      estimatedPages: sitemapUrls.length,
    };
  }

  /**
   * Phase 2: Analysis
   * Find keyword opportunities, analyze competitors, identify gaps
   */
  async analyze(discovery: DiscoveryResult): Promise<KeywordCluster[]> {
    this.reportProgress("analysis", 0, "Analyzing keywords...");
    
    // Extract seed keywords from existing content
    const seedKeywords = await this.extractSeedKeywords(discovery.pages);
    this.reportProgress("analysis", 20, `Extracted ${seedKeywords.length} seed keywords`);
    
    // Get keyword suggestions from DataForSEO
    const keywordData = await this.dataforseo.getKeywordSuggestions(
      seedKeywords.slice(0, 10).join(","),
      "United States",
      100
    );
    this.reportProgress("analysis", 50, "Fetched keyword data");
    
    // Use Claude to cluster keywords intelligently
    const clusters = await this.clusterKeywords(keywordData);
    this.reportProgress("analysis", 80, `Created ${clusters.length} keyword clusters`);
    
    // Prioritize clusters
    const prioritizedClusters = await this.prioritizeClusters(clusters, discovery);
    this.reportProgress("analysis", 100, "Analysis complete");
    
    return prioritizedClusters;
  }

  /**
   * Phase 3: Strategy
   * Create content calendar and prioritized plan
   */
  async createStrategy(clusters: KeywordCluster[]): Promise<ContentPlan> {
    this.reportProgress("strategy", 0, "Creating content strategy...");
    this.reportProgress("strategy", 30, "Generating content calendar...");
    
    const ideas = await this.ai.generateArticleIdeas(
      clusters[0]?.name || "SEO",
      [],
      this.config.articlesPerWeek * 4
    );
    
    const strategyResponse = JSON.stringify({
      calendar: [{
        week: 1,
        topics: ideas.slice(0, 4).map(idea => ({
          title: idea.title,
          targetKeyword: idea.keyword,
          estimatedWords: 1500,
        }))
      }],
      estimatedTrafficPotential: 5000,
    });
    
    let plan: ContentPlan;
    try {
      const parsed = JSON.parse(strategyResponse);
      plan = {
        clusters,
        calendar: parsed.calendar.map((week: { week: number; topics: Array<{ title: string; targetKeyword: string; estimatedWords: number }> }, idx: number) => ({
          week: week.week || idx + 1,
          topics: week.topics.map((topic: { title: string; targetKeyword: string; estimatedWords: number }) => ({
            clusterId: clusters[0]?.name || "default",
            title: topic.title,
            targetKeyword: topic.targetKeyword,
            estimatedWords: topic.estimatedWords || 1500,
            deadline: new Date(Date.now() + (idx * 7 + 3) * 24 * 60 * 60 * 1000),
          })),
        })),
        totalArticles: this.config.articlesPerWeek * 4,
        estimatedTrafficPotential: parsed.estimatedTrafficPotential || 0,
      };
    } catch {
      // Fallback plan
      plan = this.createFallbackPlan(clusters);
    }
    
    this.reportProgress("strategy", 100, "Strategy complete", {
      totalArticles: plan.totalArticles,
      trafficPotential: plan.estimatedTrafficPotential,
    });
    
    return plan;
  }

  /**
   * Phase 4: Content Generation
   * Generate full SEO-optimized articles
   */
  async generateContent(plan: ContentPlan, articleIndex: number = 0): Promise<{
    title: string;
    content: string;
    meta: {
      title: string;
      description: string;
      keywords: string[];
    };
    schema: object;
    internalLinks: Array<{ anchor: string; url: string }>;
  }> {
    const article = plan.calendar[0]?.topics[articleIndex];
    if (!article) {
      throw new Error("No article found at index " + articleIndex);
    }
    
    this.reportProgress("generation", 0, `Generating: ${article.title}`);
    
    // Generate outline first using SERP data simulation
    const outline = await this.ai.generateOutline(
      article.targetKeyword,
      [{ title: article.title, description: `Article about ${article.targetKeyword}` }],
      article.estimatedWords
    );
    this.reportProgress("generation", 25, "Outline complete");
    
    // Generate full content
    const generatedContent = await this.ai.generateArticle(
      article.targetKeyword,
      outline,
      this.config.contentTone
    );
    const content = generatedContent.body;
    this.reportProgress("generation", 60, "Content generated");
    
    // Generate meta tags
    const metaResult = await this.ai.generateMeta(content, article.targetKeyword);
    const meta = {
      title: metaResult.metaTitle,
      description: metaResult.metaDescription,
      keywords: [article.targetKeyword],
    };
    this.reportProgress("generation", 80, "Meta tags generated");
    
    // Generate schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: meta.description,
      keywords: meta.keywords.join(", "),
      datePublished: new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: "CabbageSEO",
      },
    };
    
    // Suggest internal links (placeholder - would analyze existing content)
    const internalLinks: Array<{ anchor: string; url: string }> = [];
    
    this.reportProgress("generation", 100, "Content ready for review");
    
    return {
      title: article.title,
      content,
      meta,
      schema,
      internalLinks,
    };
  }

  /**
   * Phase 5: Publishing
   * Publish to connected CMS
   */
  async publish(content: {
    title: string;
    content: string;
    meta: { title: string; description: string; keywords: string[] };
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.wordpress) {
      return { success: false, error: "No CMS connected" };
    }
    
    this.reportProgress("publishing", 0, "Publishing to WordPress...");
    
    try {
      const result = await this.wordpress.createPost({
        title: content.title,
        content: content.content,
        status: this.config.autoPublish ? "publish" : "draft",
        meta: {
          yoast_wpseo_title: content.meta.title,
          yoast_wpseo_metadesc: content.meta.description,
        },
      });
      
      this.reportProgress("publishing", 100, "Published successfully", { url: result.url });
      
      return { success: true, url: result.url };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publishing failed";
      return { success: false, error: message };
    }
  }

  /**
   * Run full autopilot cycle
   */
  async run(): Promise<{
    discovery: DiscoveryResult;
    clusters: KeywordCluster[];
    plan: ContentPlan;
    generatedArticle: {
      title: string;
      content: string;
      meta: {
        title: string;
        description: string;
        keywords: string[];
      };
      schema: object;
      internalLinks: Array<{ anchor: string; url: string }>;
    };
  }> {
    // Phase 1: Discovery
    const discovery = await this.discover();
    
    // Phase 2: Analysis
    const clusters = await this.analyze(discovery);
    
    // Phase 3: Strategy
    const plan = await this.createStrategy(clusters);
    
    // Phase 4: Generate first article
    const generatedArticle = await this.generateContent(plan, 0);
    
    return {
      discovery,
      clusters,
      plan,
      generatedArticle,
    };
  }

  // Helper methods
  private async fetchSitemap(siteUrl: string): Promise<string[]> {
    try {
      const response = await fetch(`${siteUrl}/sitemap.xml`);
      const xml = await response.text();
      
      // Simple regex to extract URLs (in production use proper XML parser)
      const urls = xml.match(/<loc>(.*?)<\/loc>/g)?.map(
        match => match.replace(/<\/?loc>/g, "")
      ) || [];
      
      return urls;
    } catch {
      // Try common sitemap locations
      const alternatives = [
        "/sitemap_index.xml",
        "/sitemap-pages.xml",
        "/sitemap-posts.xml",
      ];
      
      for (const alt of alternatives) {
        try {
          const response = await fetch(`${siteUrl}${alt}`);
          if (response.ok) {
            const xml = await response.text();
            const urls = xml.match(/<loc>(.*?)<\/loc>/g)?.map(
              match => match.replace(/<\/?loc>/g, "")
            ) || [];
            if (urls.length > 0) return urls;
          }
        } catch {
          continue;
        }
      }
      
      return [];
    }
  }

  private async crawlPage(url: string): Promise<DiscoveryResult["pages"][0]> {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;
    
    // Detect page type
    let type: "page" | "post" | "category" | "product" = "page";
    if (url.includes("/blog/") || url.includes("/post/")) type = "post";
    if (url.includes("/category/") || url.includes("/tag/")) type = "category";
    if (url.includes("/product/") || url.includes("/shop/")) type = "product";
    
    return { url, title, type };
  }

  private async detectTechnologies(siteUrl: string): Promise<string[]> {
    try {
      const response = await fetch(siteUrl);
      const html = await response.text();
      
      const technologies: string[] = [];
      
      // Detect WordPress
      if (html.includes("wp-content") || html.includes("wordpress")) {
        technologies.push("WordPress");
      }
      
      // Detect Shopify
      if (html.includes("shopify") || html.includes("cdn.shopify.com")) {
        technologies.push("Shopify");
      }
      
      // Detect Webflow
      if (html.includes("webflow")) {
        technologies.push("Webflow");
      }
      
      // Detect React/Next.js
      if (html.includes("__NEXT_DATA__")) {
        technologies.push("Next.js");
      }
      
      return technologies;
    } catch {
      return [];
    }
  }

  private async extractSeedKeywords(pages: DiscoveryResult["pages"]): Promise<string[]> {
    // Extract keywords from page titles using simple extraction
    const keywords = new Set<string>();
    
    for (const page of pages) {
      // Split title into words and extract meaningful ones
      const words = page.title
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3)
        .filter(w => !["the", "and", "for", "with", "from", "this", "that", "what", "how"].includes(w));
      
      words.forEach(w => keywords.add(w));
    }
    
    return Array.from(keywords).slice(0, 20);
  }

  private async clusterKeywords(keywordData: Array<{ keyword: string; volume: number; difficulty: number; cpc: number }>): Promise<KeywordCluster[]> {
    const keywords = keywordData.map(k => k.keyword);
    const clusterResult = await this.ai.clusterKeywords(keywords);
    
    return clusterResult.map(c => ({
      name: c.name,
      intent: "informational" as const,
      keywords: c.keywords.map(kw => {
        const found = keywordData.find(d => d.keyword === kw);
        return found || { keyword: kw, volume: 0, difficulty: 50, cpc: 0 };
      }),
      priority: "medium" as const,
      suggestedContentType: "guide" as const,
    }));
  }

  private async prioritizeClusters(clusters: KeywordCluster[], _discovery: DiscoveryResult): Promise<KeywordCluster[]> {
    return clusters.map(cluster => {
      const avgVolume = cluster.keywords.reduce((sum, k) => sum + k.volume, 0) / cluster.keywords.length;
      const avgDifficulty = cluster.keywords.reduce((sum, k) => sum + k.difficulty, 0) / cluster.keywords.length;
      
      // High volume + low difficulty = high priority
      let priority: "high" | "medium" | "low" = "medium";
      if (avgVolume > 1000 && avgDifficulty < 40) priority = "high";
      if (avgVolume < 100 || avgDifficulty > 70) priority = "low";
      
      return { ...cluster, priority };
    }).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private createFallbackPlan(clusters: KeywordCluster[]): ContentPlan {
    const topics = clusters.slice(0, 4).map((cluster, i) => ({
      clusterId: cluster.name,
      title: `Complete Guide to ${cluster.name}`,
      targetKeyword: cluster.keywords[0]?.keyword || cluster.name,
      estimatedWords: 1500,
      deadline: new Date(Date.now() + (i * 7 + 3) * 24 * 60 * 60 * 1000),
    }));
    
    return {
      clusters,
      calendar: [{ week: 1, topics }],
      totalArticles: topics.length,
      estimatedTrafficPotential: 0,
    };
  }
}

/**
 * Quick start function for URL → Autopilot
 */
export async function startAutopilot(
  siteUrl: string,
  organizationId: string,
  siteId: string,
  options: Partial<AutopilotConfig> = {},
  onProgress?: ProgressCallback
) {
  const config: AutopilotConfig = {
    siteUrl,
    organizationId,
    siteId,
    autoPublish: false,
    contentTone: "professional",
    targetAudience: "general audience",
    primaryLanguage: "en",
    articlesPerWeek: 2,
    ...options,
  };
  
  const engine = new AutopilotEngine(config, onProgress);
  return engine.run();
}

