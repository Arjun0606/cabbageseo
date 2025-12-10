/**
 * Technical SEO Audit Engine for CabbageSEO
 * 
 * Analyzes crawled pages for SEO issues:
 * - Meta tag issues (missing, duplicate, too long/short)
 * - Heading structure problems
 * - Image optimization issues
 * - Link issues (broken, orphan pages)
 * - Content issues (thin content, duplicate)
 * - Technical issues (canonicals, robots, etc.)
 */

import { PageData, CrawlResult, ImageData, LinkData } from "./site-crawler";

// ============================================
// TYPES
// ============================================

export type IssueSeverity = "critical" | "warning" | "info";
export type IssueCategory = 
  | "meta" 
  | "headings" 
  | "images" 
  | "links" 
  | "content" 
  | "technical" 
  | "performance"
  | "schema";

export interface AuditIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  url: string;
  details?: Record<string, unknown>;
  fix?: AuditFix;
}

export interface AuditFix {
  type: "auto" | "manual" | "suggestion";
  description: string;
  code?: string;
  value?: string;
}

export interface AuditResult {
  siteUrl: string;
  score: number;  // 0-100
  issues: AuditIssue[];
  summary: AuditSummary;
  pageScores: PageScore[];
  auditedAt: string;
}

export interface AuditSummary {
  totalPages: number;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  categoryBreakdown: Record<IssueCategory, number>;
}

export interface PageScore {
  url: string;
  score: number;
  issues: number;
  criticalIssues: number;
}

// ============================================
// AUDIT CONFIGURATION
// ============================================

const AUDIT_CONFIG = {
  meta: {
    titleMinLength: 30,
    titleMaxLength: 60,
    titleOptimalLength: { min: 50, max: 60 },
    descriptionMinLength: 70,
    descriptionMaxLength: 160,
    descriptionOptimalLength: { min: 120, max: 155 },
  },
  content: {
    minWordCount: 300,
    thinContentThreshold: 200,
    duplicateThreshold: 0.8,  // 80% similarity
  },
  images: {
    maxFileSizeKb: 200,
    requiredAlt: true,
  },
  performance: {
    maxLoadTimeMs: 3000,
    maxHtmlSizeKb: 500,
  },
  headings: {
    maxH1Count: 1,
    requireH1: true,
  },
};

// ============================================
// TECHNICAL AUDIT ENGINE
// ============================================

export class TechnicalAuditEngine {
  private issues: AuditIssue[] = [];
  private pageScores: Map<string, { score: number; issues: number; critical: number }> = new Map();

  /**
   * Run a complete technical SEO audit
   */
  audit(crawlResult: CrawlResult): AuditResult {
    this.issues = [];
    this.pageScores.clear();

    const { pages } = crawlResult;

    // Run all audit checks
    for (const page of pages) {
      this.initPageScore(page.url);
      
      this.auditMetaTags(page);
      this.auditHeadings(page);
      this.auditImages(page);
      this.auditLinks(page, pages);
      this.auditContent(page, pages);
      this.auditTechnical(page);
      this.auditPerformance(page);
      this.auditSchema(page);
    }

    // Site-wide checks
    this.auditDuplicateContent(pages);
    this.auditOrphanPages(pages);
    this.auditInternalLinking(pages);

    // Calculate scores
    const score = this.calculateOverallScore();
    const summary = this.generateSummary(pages.length);
    const pageScores = this.getPageScores();

    return {
      siteUrl: crawlResult.siteUrl,
      score,
      issues: this.issues,
      summary,
      pageScores,
      auditedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // META TAG AUDITS
  // ============================================

  private auditMetaTags(page: PageData): void {
    const { url, title, metaDescription } = page;
    const config = AUDIT_CONFIG.meta;

    // Title checks
    if (!title) {
      this.addIssue({
        category: "meta",
        severity: "critical",
        title: "Missing Title Tag",
        description: "This page has no title tag. Title tags are crucial for SEO and user experience.",
        url,
        fix: {
          type: "suggestion",
          description: "Add a descriptive title tag between 50-60 characters.",
        },
      });
    } else {
      if (title.length < config.titleMinLength) {
        this.addIssue({
          category: "meta",
          severity: "warning",
          title: "Title Too Short",
          description: `Title is only ${title.length} characters. Aim for ${config.titleOptimalLength.min}-${config.titleOptimalLength.max} characters.`,
          url,
          details: { currentLength: title.length, title },
          fix: {
            type: "suggestion",
            description: "Expand the title to include more relevant keywords.",
          },
        });
      } else if (title.length > config.titleMaxLength) {
        this.addIssue({
          category: "meta",
          severity: "warning",
          title: "Title Too Long",
          description: `Title is ${title.length} characters and may be truncated in search results. Keep under ${config.titleMaxLength} characters.`,
          url,
          details: { currentLength: title.length, title },
          fix: {
            type: "suggestion",
            description: "Shorten the title while keeping important keywords at the beginning.",
          },
        });
      }
    }

    // Meta description checks
    if (!metaDescription) {
      this.addIssue({
        category: "meta",
        severity: "warning",
        title: "Missing Meta Description",
        description: "This page has no meta description. Google may generate one automatically, which may not be optimal.",
        url,
        fix: {
          type: "auto",
          description: "Generate a compelling meta description.",
        },
      });
    } else {
      if (metaDescription.length < config.descriptionMinLength) {
        this.addIssue({
          category: "meta",
          severity: "info",
          title: "Meta Description Too Short",
          description: `Meta description is only ${metaDescription.length} characters. Aim for ${config.descriptionOptimalLength.min}-${config.descriptionOptimalLength.max} characters.`,
          url,
          details: { currentLength: metaDescription.length },
        });
      } else if (metaDescription.length > config.descriptionMaxLength) {
        this.addIssue({
          category: "meta",
          severity: "info",
          title: "Meta Description Too Long",
          description: `Meta description is ${metaDescription.length} characters and may be truncated. Keep under ${config.descriptionMaxLength} characters.`,
          url,
          details: { currentLength: metaDescription.length },
        });
      }
    }

    // OG Tags
    if (!page.ogTags["og:title"]) {
      this.addIssue({
        category: "meta",
        severity: "info",
        title: "Missing Open Graph Title",
        description: "No og:title tag found. This affects how the page appears when shared on social media.",
        url,
        fix: {
          type: "auto",
          description: "Add og:title meta tag.",
          code: `<meta property="og:title" content="${title}" />`,
        },
      });
    }

    if (!page.ogTags["og:description"]) {
      this.addIssue({
        category: "meta",
        severity: "info",
        title: "Missing Open Graph Description",
        description: "No og:description tag found. Add for better social media sharing.",
        url,
      });
    }

    if (!page.ogTags["og:image"]) {
      this.addIssue({
        category: "meta",
        severity: "info",
        title: "Missing Open Graph Image",
        description: "No og:image tag found. Pages with images get more engagement on social media.",
        url,
      });
    }
  }

  // ============================================
  // HEADING AUDITS
  // ============================================

  private auditHeadings(page: PageData): void {
    const { url, h1, h2 } = page;

    // H1 checks
    if (h1.length === 0) {
      this.addIssue({
        category: "headings",
        severity: "critical",
        title: "Missing H1 Tag",
        description: "This page has no H1 heading. Every page should have exactly one H1.",
        url,
        fix: {
          type: "manual",
          description: "Add an H1 heading that describes the main topic of the page.",
        },
      });
    } else if (h1.length > 1) {
      this.addIssue({
        category: "headings",
        severity: "warning",
        title: "Multiple H1 Tags",
        description: `This page has ${h1.length} H1 tags. Best practice is to have exactly one H1 per page.`,
        url,
        details: { h1Tags: h1 },
        fix: {
          type: "manual",
          description: "Keep the most important H1 and change others to H2 or lower.",
        },
      });
    }

    // Check H1 length
    if (h1.length > 0 && h1[0].length > 70) {
      this.addIssue({
        category: "headings",
        severity: "info",
        title: "H1 Tag Too Long",
        description: `H1 is ${h1[0].length} characters. Consider keeping it under 70 characters for better readability.`,
        url,
        details: { h1: h1[0] },
      });
    }

    // Check for heading hierarchy
    if (h1.length > 0 && h2.length === 0) {
      this.addIssue({
        category: "headings",
        severity: "info",
        title: "No H2 Headings",
        description: "This page has no H2 headings. Consider adding subheadings to improve content structure.",
        url,
      });
    }
  }

  // ============================================
  // IMAGE AUDITS
  // ============================================

  private auditImages(page: PageData): void {
    const { url, images } = page;

    // Check each image
    for (const image of images) {
      if (!image.alt) {
        this.addIssue({
          category: "images",
          severity: "warning",
          title: "Missing Alt Text",
          description: "Image is missing alt text, which is important for accessibility and SEO.",
          url,
          details: { imageSrc: image.src },
          fix: {
            type: "auto",
            description: "Generate descriptive alt text for this image.",
          },
        });
      } else if (image.alt.length < 5) {
        this.addIssue({
          category: "images",
          severity: "info",
          title: "Short Alt Text",
          description: "Image alt text is very short. Consider a more descriptive alternative.",
          url,
          details: { imageSrc: image.src, alt: image.alt },
        });
      }

      // Check for dimensions
      if (!image.width || !image.height) {
        this.addIssue({
          category: "images",
          severity: "info",
          title: "Missing Image Dimensions",
          description: "Image is missing width/height attributes. This can cause layout shifts.",
          url,
          details: { imageSrc: image.src },
          fix: {
            type: "manual",
            description: "Add width and height attributes to prevent Cumulative Layout Shift (CLS).",
          },
        });
      }
    }

    // Total images without alt
    const missingAlt = images.filter(i => !i.alt).length;
    if (missingAlt > 5) {
      this.addIssue({
        category: "images",
        severity: "warning",
        title: "Many Images Missing Alt Text",
        description: `${missingAlt} images on this page are missing alt text.`,
        url,
        details: { count: missingAlt },
      });
    }
  }

  // ============================================
  // LINK AUDITS
  // ============================================

  private auditLinks(page: PageData, allPages: PageData[]): void {
    const { url, links } = page;
    const allUrls = new Set(allPages.map(p => p.url));

    // Check internal links
    const internalLinks = links.filter(l => l.isInternal);
    const brokenInternalLinks = internalLinks.filter(l => !allUrls.has(l.href));

    for (const broken of brokenInternalLinks) {
      this.addIssue({
        category: "links",
        severity: "critical",
        title: "Broken Internal Link",
        description: `Link to "${broken.href}" appears to be broken or leads to a non-existent page.`,
        url,
        details: { brokenLink: broken.href, linkText: broken.text },
        fix: {
          type: "manual",
          description: "Update or remove this broken link.",
        },
      });
    }

    // Check for too many links
    if (links.length > 100) {
      this.addIssue({
        category: "links",
        severity: "warning",
        title: "Too Many Links",
        description: `This page has ${links.length} links. Consider reducing to improve link equity distribution.`,
        url,
        details: { linkCount: links.length },
      });
    }

    // Check for links with no text
    const emptyLinks = links.filter(l => !l.text || l.text.length < 2);
    if (emptyLinks.length > 0) {
      this.addIssue({
        category: "links",
        severity: "info",
        title: "Links Without Anchor Text",
        description: `${emptyLinks.length} links have little or no anchor text.`,
        url,
        details: { count: emptyLinks.length },
      });
    }
  }

  // ============================================
  // CONTENT AUDITS
  // ============================================

  private auditContent(page: PageData, allPages: PageData[]): void {
    const { url, wordCount, title } = page;
    const config = AUDIT_CONFIG.content;

    // Thin content check
    if (wordCount < config.thinContentThreshold) {
      this.addIssue({
        category: "content",
        severity: "warning",
        title: "Thin Content",
        description: `This page has only ${wordCount} words. Pages with thin content may struggle to rank.`,
        url,
        details: { wordCount },
        fix: {
          type: "auto",
          description: "Expand the content with relevant information, examples, or additional sections.",
        },
      });
    } else if (wordCount < config.minWordCount) {
      this.addIssue({
        category: "content",
        severity: "info",
        title: "Low Word Count",
        description: `This page has ${wordCount} words. Consider adding more content for better SEO.`,
        url,
        details: { wordCount },
      });
    }

    // Check for duplicate titles
    const duplicateTitles = allPages.filter(p => p.url !== url && p.title === title);
    if (duplicateTitles.length > 0) {
      this.addIssue({
        category: "content",
        severity: "warning",
        title: "Duplicate Title",
        description: `This title is used on ${duplicateTitles.length + 1} pages. Each page should have a unique title.`,
        url,
        details: { duplicateUrls: duplicateTitles.map(p => p.url) },
        fix: {
          type: "manual",
          description: "Create unique titles for each page.",
        },
      });
    }
  }

  // ============================================
  // TECHNICAL AUDITS
  // ============================================

  private auditTechnical(page: PageData): void {
    const { url, canonicalUrl, robots, statusCode } = page;

    // Status code checks
    if (statusCode >= 400) {
      this.addIssue({
        category: "technical",
        severity: "critical",
        title: `HTTP ${statusCode} Error`,
        description: `This page returns a ${statusCode} status code.`,
        url,
        details: { statusCode },
      });
    } else if (statusCode >= 300 && statusCode < 400) {
      this.addIssue({
        category: "technical",
        severity: "info",
        title: "Redirect Detected",
        description: `This URL redirects (${statusCode}). Ensure redirect chains are minimal.`,
        url,
        details: { statusCode },
      });
    }

    // Canonical checks
    if (canonicalUrl && canonicalUrl !== url) {
      this.addIssue({
        category: "technical",
        severity: "info",
        title: "Canonical Points Elsewhere",
        description: `This page's canonical URL points to a different page.`,
        url,
        details: { canonical: canonicalUrl },
      });
    }

    // Robots meta checks
    if (robots) {
      const robotsLower = robots.toLowerCase();
      if (robotsLower.includes("noindex")) {
        this.addIssue({
          category: "technical",
          severity: "warning",
          title: "Page Set to Noindex",
          description: "This page has noindex set and will not appear in search results.",
          url,
          details: { robots },
        });
      }
      if (robotsLower.includes("nofollow")) {
        this.addIssue({
          category: "technical",
          severity: "info",
          title: "Page Set to Nofollow",
          description: "Links on this page will not pass link equity.",
          url,
          details: { robots },
        });
      }
    }
  }

  // ============================================
  // PERFORMANCE AUDITS
  // ============================================

  private auditPerformance(page: PageData): void {
    const { url, loadTimeMs, htmlSize } = page;
    const config = AUDIT_CONFIG.performance;

    // Load time check
    if (loadTimeMs > config.maxLoadTimeMs) {
      this.addIssue({
        category: "performance",
        severity: "warning",
        title: "Slow Page Load",
        description: `Page took ${(loadTimeMs / 1000).toFixed(1)}s to load. Aim for under ${config.maxLoadTimeMs / 1000}s.`,
        url,
        details: { loadTimeMs },
        fix: {
          type: "manual",
          description: "Optimize images, enable compression, and minimize JavaScript.",
        },
      });
    }

    // HTML size check
    const htmlSizeKb = htmlSize / 1024;
    if (htmlSizeKb > config.maxHtmlSizeKb) {
      this.addIssue({
        category: "performance",
        severity: "info",
        title: "Large HTML Size",
        description: `HTML is ${htmlSizeKb.toFixed(0)}KB. Large HTML can slow down parsing.`,
        url,
        details: { htmlSizeKb: Math.round(htmlSizeKb) },
      });
    }
  }

  // ============================================
  // SCHEMA AUDITS
  // ============================================

  private auditSchema(page: PageData): void {
    const { url, schemaMarkup } = page;

    if (schemaMarkup.length === 0) {
      this.addIssue({
        category: "schema",
        severity: "info",
        title: "No Schema Markup",
        description: "This page has no structured data. Adding schema can improve search appearance.",
        url,
        fix: {
          type: "auto",
          description: "Generate appropriate schema markup for this page type.",
        },
      });
    } else {
      // Check for common schema types
      const hasArticle = schemaMarkup.some(s => 
        (s as { "@type"?: string })["@type"]?.includes("Article")
      );
      const hasOrganization = schemaMarkup.some(s => 
        (s as { "@type"?: string })["@type"] === "Organization"
      );
      const hasBreadcrumb = schemaMarkup.some(s => 
        (s as { "@type"?: string })["@type"] === "BreadcrumbList"
      );

      if (!hasBreadcrumb) {
        this.addIssue({
          category: "schema",
          severity: "info",
          title: "Missing Breadcrumb Schema",
          description: "Consider adding BreadcrumbList schema for better navigation in search results.",
          url,
        });
      }
    }
  }

  // ============================================
  // SITE-WIDE AUDITS
  // ============================================

  private auditDuplicateContent(pages: PageData[]): void {
    // Check for duplicate meta descriptions
    const descriptionMap = new Map<string, string[]>();
    
    for (const page of pages) {
      if (page.metaDescription) {
        const existing = descriptionMap.get(page.metaDescription) || [];
        existing.push(page.url);
        descriptionMap.set(page.metaDescription, existing);
      }
    }

    for (const [description, urls] of descriptionMap.entries()) {
      if (urls.length > 1) {
        this.addIssue({
          category: "content",
          severity: "warning",
          title: "Duplicate Meta Description",
          description: `${urls.length} pages share the same meta description.`,
          url: urls[0],
          details: { urls, description: description.slice(0, 100) },
          fix: {
            type: "auto",
            description: "Generate unique meta descriptions for each page.",
          },
        });
      }
    }
  }

  private auditOrphanPages(pages: PageData[]): void {
    // Build a map of all internal links
    const linkedPages = new Set<string>();
    
    for (const page of pages) {
      for (const link of page.links) {
        if (link.isInternal) {
          linkedPages.add(link.href);
        }
      }
    }

    // Find pages with no incoming links
    for (const page of pages) {
      if (page.depth > 0 && !linkedPages.has(page.url)) {
        this.addIssue({
          category: "links",
          severity: "warning",
          title: "Orphan Page",
          description: "This page has no internal links pointing to it, making it hard to discover.",
          url: page.url,
          fix: {
            type: "auto",
            description: "Add internal links to this page from relevant content.",
          },
        });
      }
    }
  }

  private auditInternalLinking(pages: PageData[]): void {
    // Check average internal links per page
    const avgLinks = pages.reduce((sum, p) => 
      sum + p.links.filter(l => l.isInternal).length, 0
    ) / pages.length;

    if (avgLinks < 3) {
      this.addIssue({
        category: "links",
        severity: "warning",
        title: "Weak Internal Linking",
        description: `Average of only ${avgLinks.toFixed(1)} internal links per page. Consider improving internal linking structure.`,
        url: pages[0]?.url || "",
        details: { averageInternalLinks: avgLinks },
      });
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private addIssue(issue: Omit<AuditIssue, "id">): void {
    const id = `${issue.category}-${this.issues.length}`;
    this.issues.push({ ...issue, id });
    
    // Update page score
    const pageScore = this.pageScores.get(issue.url);
    if (pageScore) {
      pageScore.issues++;
      if (issue.severity === "critical") {
        pageScore.critical++;
        pageScore.score -= 15;
      } else if (issue.severity === "warning") {
        pageScore.score -= 5;
      } else {
        pageScore.score -= 1;
      }
    }
  }

  private initPageScore(url: string): void {
    this.pageScores.set(url, { score: 100, issues: 0, critical: 0 });
  }

  private calculateOverallScore(): number {
    if (this.pageScores.size === 0) return 100;

    let totalScore = 0;
    for (const score of this.pageScores.values()) {
      totalScore += Math.max(0, score.score);
    }

    return Math.round(totalScore / this.pageScores.size);
  }

  private generateSummary(totalPages: number): AuditSummary {
    const categoryBreakdown: Record<IssueCategory, number> = {
      meta: 0,
      headings: 0,
      images: 0,
      links: 0,
      content: 0,
      technical: 0,
      performance: 0,
      schema: 0,
    };

    let critical = 0;
    let warning = 0;
    let info = 0;

    for (const issue of this.issues) {
      categoryBreakdown[issue.category]++;
      
      if (issue.severity === "critical") critical++;
      else if (issue.severity === "warning") warning++;
      else info++;
    }

    return {
      totalPages,
      totalIssues: this.issues.length,
      criticalIssues: critical,
      warningIssues: warning,
      infoIssues: info,
      categoryBreakdown,
    };
  }

  private getPageScores(): PageScore[] {
    const scores: PageScore[] = [];
    
    for (const [url, data] of this.pageScores.entries()) {
      scores.push({
        url,
        score: Math.max(0, data.score),
        issues: data.issues,
        criticalIssues: data.critical,
      });
    }

    return scores.sort((a, b) => a.score - b.score);
  }
}

// ============================================
// EXPORTS
// ============================================

export function createAuditEngine(): TechnicalAuditEngine {
  return new TechnicalAuditEngine();
}

