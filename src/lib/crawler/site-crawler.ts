/**
 * Site Crawler for CabbageSEO
 * 
 * Production-ready web crawler that:
 * - Fetches and parses HTML pages
 * - Extracts URLs, content, meta tags, headings
 * - Follows internal links
 * - Respects robots.txt
 * - Handles rate limiting
 * - Tracks crawl progress
 */

import * as cheerio from "cheerio";
import { createAIOAnalyzer } from "@/lib/aio";
import type { AIOAnalysisInput } from "@/lib/aio/types";

// ============================================
// TYPES
// ============================================

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  delayMs?: number;
  timeout?: number;
  userAgent?: string;
  respectRobotsTxt?: boolean;
  followExternalLinks?: boolean;
  includeSubdomains?: boolean;
  /** Include raw HTML/text content for later AIO analysis */
  includeRawContent?: boolean;
  /** Run AIO scoring during crawl (slower but comprehensive) */
  includeAIOScoring?: boolean;
}

export interface PageData {
  url: string;
  statusCode: number;
  contentType: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  images: ImageData[];
  links: LinkData[];
  wordCount: number;
  loadTimeMs: number;
  htmlSize: number;
  robots: string | null;
  ogTags: Record<string, string>;
  schemaMarkup: object[];
  crawledAt: string;
  depth: number;
  
  // Raw content for AIO analysis
  rawHtml?: string;
  textContent?: string;
  
  // AIO scores (populated if includeAIOScoring is enabled)
  aioScores?: {
    combined: number;
    google_aio: number;
    chatgpt: number;
    perplexity: number;
    claude: number;
    gemini: number;
  };
  entityCount?: number;
  quotabilityScore?: number;
  answerStructureScore?: number;
  hasExpertAttribution?: boolean;
}

export interface ImageData {
  src: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isLazy: boolean;
}

export interface LinkData {
  href: string;
  text: string;
  isInternal: boolean;
  isNofollow: boolean;
  isBroken?: boolean;
}

export interface CrawlResult {
  siteUrl: string;
  pages: PageData[];
  totalPages: number;
  crawledPages: number;
  errors: CrawlError[];
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface CrawlError {
  url: string;
  error: string;
  statusCode?: number;
}

export interface RobotsTxt {
  allowedPaths: string[];
  disallowedPaths: string[];
  sitemaps: string[];
  crawlDelay?: number;
}

// ============================================
// SITE CRAWLER
// ============================================

export class SiteCrawler {
  private options: Required<CrawlOptions>;
  private visited: Set<string> = new Set();
  private queue: Array<{ url: string; depth: number }> = [];
  private pages: PageData[] = [];
  private errors: CrawlError[] = [];
  private robotsTxt: RobotsTxt | null = null;
  private baseUrl: URL | null = null;
  private abortController: AbortController | null = null;

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxPages: options.maxPages ?? 100,
      maxDepth: options.maxDepth ?? 5,
      delayMs: options.delayMs ?? 500,
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent ?? "CabbageSEO Bot/1.0 (+https://cabbageseo.com/bot)",
      respectRobotsTxt: options.respectRobotsTxt ?? true,
      followExternalLinks: options.followExternalLinks ?? false,
      includeSubdomains: options.includeSubdomains ?? false,
      includeRawContent: options.includeRawContent ?? false,
      includeAIOScoring: options.includeAIOScoring ?? false,
    };
  }

  /**
   * Crawl a website starting from the given URL
   */
  async crawl(
    startUrl: string,
    onProgress?: (progress: { crawled: number; total: number; current: string }) => void
  ): Promise<CrawlResult> {
    const startTime = Date.now();
    this.reset();
    
    try {
      this.baseUrl = new URL(startUrl);
    } catch {
      throw new Error(`Invalid URL: ${startUrl}`);
    }

    this.abortController = new AbortController();

    // Fetch robots.txt if enabled
    if (this.options.respectRobotsTxt) {
      await this.fetchRobotsTxt();
    }

    // Start crawling
    this.queue.push({ url: this.normalizeUrl(startUrl), depth: 0 });

    while (this.queue.length > 0 && this.pages.length < this.options.maxPages) {
      const item = this.queue.shift()!;
      
      if (this.visited.has(item.url)) continue;
      if (item.depth > this.options.maxDepth) continue;
      if (!this.isAllowedByRobots(item.url)) continue;

      this.visited.add(item.url);

      // Progress callback
      onProgress?.({
        crawled: this.pages.length,
        total: Math.min(this.visited.size + this.queue.length, this.options.maxPages),
        current: item.url,
      });

      // Crawl the page
      const pageData = await this.crawlPage(item.url, item.depth);
      
      if (pageData) {
        this.pages.push(pageData);
        
        // Add internal links to queue
        for (const link of pageData.links) {
          if (link.isInternal && !this.visited.has(link.href)) {
            this.queue.push({ url: link.href, depth: item.depth + 1 });
          }
        }
      }

      // Respect rate limiting
      if (this.queue.length > 0) {
        await this.delay(this.robotsTxt?.crawlDelay ?? this.options.delayMs);
      }
    }

    const endTime = Date.now();

    return {
      siteUrl: startUrl,
      pages: this.pages,
      totalPages: this.visited.size,
      crawledPages: this.pages.length,
      errors: this.errors,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
    };
  }

  /**
   * Stop an ongoing crawl
   */
  stop(): void {
    this.abortController?.abort();
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string, depth: number): Promise<PageData | null> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": this.options.userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: this.abortController?.signal,
        redirect: "follow",
      });

      const loadTimeMs = Date.now() - startTime;
      const contentType = response.headers.get("content-type") || "";

      // Only process HTML pages
      if (!contentType.includes("text/html")) {
        return null;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract text content for AIO analysis
      const textContent = this.extractTextContent($);
      
      // Build headings array for AIO
      const allHeadings: { level: number; text: string }[] = [];
      for (let i = 1; i <= 6; i++) {
        this.extractHeadings($, `h${i}`).forEach(text => {
          allHeadings.push({ level: i, text });
        });
      }

      // Extract page data
      const pageData: PageData = {
        url,
        statusCode: response.status,
        contentType,
        title: this.extractTitle($),
        metaDescription: this.extractMeta($, "description"),
        metaKeywords: this.extractMeta($, "keywords"),
        canonicalUrl: this.extractCanonical($),
        h1: this.extractHeadings($, "h1"),
        h2: this.extractHeadings($, "h2"),
        h3: this.extractHeadings($, "h3"),
        images: this.extractImages($, url),
        links: this.extractLinks($, url),
        wordCount: this.countWords($),
        loadTimeMs,
        htmlSize: html.length,
        robots: this.extractMeta($, "robots"),
        ogTags: this.extractOgTags($),
        schemaMarkup: this.extractSchemaMarkup($),
        crawledAt: new Date().toISOString(),
        depth,
      };

      // Include raw content if requested
      if (this.options.includeRawContent) {
        pageData.rawHtml = html;
        pageData.textContent = textContent;
      }

      // Run AIO analysis if requested
      if (this.options.includeAIOScoring) {
        const aioInput: AIOAnalysisInput = {
          url,
          title: pageData.title,
          content: textContent,
          htmlContent: html,
          metaDescription: pageData.metaDescription,
          headings: allHeadings,
          wordCount: pageData.wordCount,
        };

        try {
          const analyzer = createAIOAnalyzer();
          const aioResult = await analyzer.analyze(aioInput);
          
          pageData.aioScores = {
            combined: aioResult.scores.combined,
            google_aio: aioResult.scores.platforms.google_aio,
            chatgpt: aioResult.scores.platforms.chatgpt,
            perplexity: aioResult.scores.platforms.perplexity,
            claude: aioResult.scores.platforms.claude,
            gemini: aioResult.scores.platforms.gemini,
          };
          pageData.entityCount = aioResult.entities.length;
          pageData.quotabilityScore = aioResult.quotabilityScore;
          pageData.answerStructureScore = aioResult.answerStructureScore;
          pageData.hasExpertAttribution = aioResult.contentStructure.hasExpertAttribution;
        } catch (aioError) {
          // Log but don't fail the crawl
          console.error("AIO analysis error for", url, aioError);
        }
      }

      return pageData;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.errors.push({ url, error: message });
      return null;
    }
  }

  /**
   * Fetch and parse robots.txt
   */
  private async fetchRobotsTxt(): Promise<void> {
    if (!this.baseUrl) return;

    try {
      const robotsUrl = `${this.baseUrl.origin}/robots.txt`;
      const response = await fetch(robotsUrl, {
        headers: { "User-Agent": this.options.userAgent },
      });

      if (!response.ok) return;

      const text = await response.text();
      this.robotsTxt = this.parseRobotsTxt(text);
    } catch {
      // robots.txt not available, allow all
    }
  }

  /**
   * Parse robots.txt content
   */
  private parseRobotsTxt(content: string): RobotsTxt {
    const result: RobotsTxt = {
      allowedPaths: [],
      disallowedPaths: [],
      sitemaps: [],
    };

    let isRelevantUserAgent = false;
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.slice(11).trim();
        isRelevantUserAgent = agent === "*" || agent.includes("cabbageseo");
      } else if (isRelevantUserAgent) {
        if (trimmed.startsWith("disallow:")) {
          const path = line.slice(line.indexOf(":") + 1).trim();
          if (path) result.disallowedPaths.push(path);
        } else if (trimmed.startsWith("allow:")) {
          const path = line.slice(line.indexOf(":") + 1).trim();
          if (path) result.allowedPaths.push(path);
        } else if (trimmed.startsWith("crawl-delay:")) {
          const delay = parseInt(trimmed.slice(12).trim(), 10);
          if (!isNaN(delay)) result.crawlDelay = delay * 1000;
        }
      }
      
      if (trimmed.startsWith("sitemap:")) {
        const sitemap = line.slice(line.indexOf(":") + 1).trim();
        if (sitemap) result.sitemaps.push(sitemap);
      }
    }

    return result;
  }

  /**
   * Check if URL is allowed by robots.txt
   */
  private isAllowedByRobots(url: string): boolean {
    if (!this.robotsTxt) return true;

    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Check disallowed paths
      for (const disallowed of this.robotsTxt.disallowedPaths) {
        if (path.startsWith(disallowed)) {
          // Check if explicitly allowed
          for (const allowed of this.robotsTxt.allowedPaths) {
            if (path.startsWith(allowed)) return true;
          }
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL for consistency
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove fragment
      urlObj.hash = "";
      // Remove trailing slash for non-root paths
      if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if URL is internal
   */
  private isInternalUrl(url: string): boolean {
    if (!this.baseUrl) return false;

    try {
      const urlObj = new URL(url);
      
      if (this.options.includeSubdomains) {
        return urlObj.hostname.endsWith(this.baseUrl.hostname.replace(/^www\./, ""));
      }
      
      return urlObj.hostname === this.baseUrl.hostname;
    } catch {
      return false;
    }
  }

  // ============================================
  // EXTRACTION METHODS
  // ============================================

  private extractTitle($: cheerio.CheerioAPI): string {
    return $("title").text().trim() || "";
  }

  private extractMeta($: cheerio.CheerioAPI, name: string): string {
    return $(`meta[name="${name}"]`).attr("content")?.trim() || 
           $(`meta[property="${name}"]`).attr("content")?.trim() || "";
  }

  private extractCanonical($: cheerio.CheerioAPI): string | null {
    return $('link[rel="canonical"]').attr("href") || null;
  }

  private extractHeadings($: cheerio.CheerioAPI, tag: string): string[] {
    const headings: string[] = [];
    $(tag).each((_, el) => {
      const text = $(el).text().trim();
      if (text) headings.push(text);
    });
    return headings;
  }

  private extractImages($: cheerio.CheerioAPI, pageUrl: string): ImageData[] {
    const images: ImageData[] = [];
    
    $("img").each((_, el) => {
      const $el = $(el);
      const src = $el.attr("src") || $el.attr("data-src") || "";
      
      if (!src) return;

      // Resolve relative URLs
      let fullSrc = src;
      try {
        fullSrc = new URL(src, pageUrl).toString();
      } catch {
        // Keep original if invalid
      }

      images.push({
        src: fullSrc,
        alt: $el.attr("alt") || null,
        width: parseInt($el.attr("width") || "0", 10) || null,
        height: parseInt($el.attr("height") || "0", 10) || null,
        isLazy: Boolean($el.attr("loading") === "lazy" || $el.attr("data-src")),
      });
    });

    return images;
  }

  private extractLinks($: cheerio.CheerioAPI, pageUrl: string): LinkData[] {
    const links: LinkData[] = [];
    const seen = new Set<string>();

    $("a[href]").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") || "";
      
      // Skip empty, javascript, and mailto links
      if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      // Resolve relative URLs
      let fullHref = href;
      try {
        fullHref = new URL(href, pageUrl).toString();
      } catch {
        return; // Skip invalid URLs
      }

      // Normalize and dedupe
      const normalized = this.normalizeUrl(fullHref);
      if (seen.has(normalized)) return;
      seen.add(normalized);

      const rel = $el.attr("rel") || "";

      links.push({
        href: normalized,
        text: $el.text().trim().slice(0, 100),
        isInternal: this.isInternalUrl(normalized),
        isNofollow: rel.includes("nofollow"),
      });
    });

    return links;
  }

  private countWords($: cheerio.CheerioAPI): number {
    const text = this.extractTextContent($);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  private extractTextContent($: cheerio.CheerioAPI): string {
    // Clone to avoid modifying the original
    const $clone = cheerio.load($.html());
    $clone("script, style, noscript, nav, footer, header, aside").remove();
    return $clone("body").text().replace(/\s+/g, " ").trim();
  }

  private extractOgTags($: cheerio.CheerioAPI): Record<string, string> {
    const ogTags: Record<string, string> = {};
    
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr("property");
      const content = $(el).attr("content");
      if (property && content) {
        ogTags[property] = content;
      }
    });

    return ogTags;
  }

  private extractSchemaMarkup($: cheerio.CheerioAPI): object[] {
    const schemas: object[] = [];
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const parsed = JSON.parse(content);
          schemas.push(parsed);
        }
      } catch {
        // Invalid JSON, skip
      }
    });

    return schemas;
  }

  // ============================================
  // HELPERS
  // ============================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private reset(): void {
    this.visited.clear();
    this.queue = [];
    this.pages = [];
    this.errors = [];
    this.robotsTxt = null;
    this.baseUrl = null;
  }
}

// ============================================
// SITEMAP PARSER
// ============================================

export class SitemapParser {
  /**
   * Fetch and parse sitemap.xml
   */
  static async parse(sitemapUrl: string): Promise<string[]> {
    const urls: string[] = [];

    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          "User-Agent": "CabbageSEO Bot/1.0",
          "Accept": "application/xml,text/xml,*/*",
        },
      });

      if (!response.ok) return urls;

      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Check if this is a sitemap index
      const sitemapLocs = $("sitemap > loc");
      if (sitemapLocs.length > 0) {
        // Recursively parse sub-sitemaps
        for (let i = 0; i < Math.min(sitemapLocs.length, 10); i++) {
          const subSitemapUrl = $(sitemapLocs[i]).text().trim();
          const subUrls = await this.parse(subSitemapUrl);
          urls.push(...subUrls);
        }
      } else {
        // Regular sitemap
        $("url > loc").each((_, el) => {
          const url = $(el).text().trim();
          if (url) urls.push(url);
        });
      }
    } catch (error) {
      console.error("Sitemap parse error:", error);
    }

    return urls;
  }

  /**
   * Discover sitemap URLs from robots.txt or common locations
   */
  static async discover(baseUrl: string): Promise<string[]> {
    const sitemaps: string[] = [];

    try {
      const origin = new URL(baseUrl).origin;

      // Try robots.txt first
      const robotsResponse = await fetch(`${origin}/robots.txt`);
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        const lines = robotsText.split("\n");
        for (const line of lines) {
          if (line.toLowerCase().startsWith("sitemap:")) {
            const url = line.slice(8).trim();
            if (url) sitemaps.push(url);
          }
        }
      }

      // Try common sitemap locations if none found
      if (sitemaps.length === 0) {
        const commonLocations = [
          `${origin}/sitemap.xml`,
          `${origin}/sitemap_index.xml`,
          `${origin}/sitemap-index.xml`,
        ];

        for (const url of commonLocations) {
          try {
            const response = await fetch(url, { method: "HEAD" });
            if (response.ok) {
              sitemaps.push(url);
              break;
            }
          } catch {
            // Continue to next
          }
        }
      }
    } catch (error) {
      console.error("Sitemap discovery error:", error);
    }

    return sitemaps;
  }
}

// ============================================
// EXPORTS
// ============================================

export function createCrawler(options?: CrawlOptions): SiteCrawler {
  return new SiteCrawler(options);
}

