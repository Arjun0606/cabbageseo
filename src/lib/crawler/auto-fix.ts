/**
 * Auto-Fix Engine for CabbageSEO
 * 
 * Generates and applies automatic fixes for SEO issues:
 * - Meta tag generation
 * - Alt text suggestions
 * - Schema markup generation
 * - Internal link suggestions
 * - Content improvement suggestions
 */

import { AuditIssue, AuditResult, IssueCategory } from "./technical-audit";
import { PageData } from "./site-crawler";

// ============================================
// TYPES
// ============================================

export interface FixSuggestion {
  issueId: string;
  type: "meta" | "content" | "code" | "link" | "schema";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue: string;
  code?: string;
  impact: string;
  effort: "easy" | "medium" | "hard";
  automated: boolean;
}

export interface BulkFix {
  category: IssueCategory;
  affectedPages: number;
  fixes: FixSuggestion[];
  estimatedImpact: string;
}

export interface InternalLinkSuggestion {
  sourcePage: string;
  targetPage: string;
  anchorText: string;
  context: string;
  relevanceScore: number;
}

export interface ContentSuggestion {
  url: string;
  type: "expand" | "add-heading" | "add-faq" | "add-images";
  suggestion: string;
  priority: "high" | "medium" | "low";
}

// ============================================
// AUTO-FIX ENGINE
// ============================================

export class AutoFixEngine {
  /**
   * Generate fix suggestions for all audit issues
   */
  generateFixes(auditResult: AuditResult, pages: PageData[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    for (const issue of auditResult.issues) {
      const fix = this.generateFixForIssue(issue, pages);
      if (fix) {
        suggestions.push(fix);
      }
    }

    return suggestions.sort((a, b) => {
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate bulk fixes grouped by category
   */
  generateBulkFixes(auditResult: AuditResult, pages: PageData[]): BulkFix[] {
    const bulkFixes: BulkFix[] = [];
    const categoryIssues = new Map<IssueCategory, AuditIssue[]>();

    // Group issues by category
    for (const issue of auditResult.issues) {
      const existing = categoryIssues.get(issue.category) || [];
      existing.push(issue);
      categoryIssues.set(issue.category, existing);
    }

    // Generate bulk fixes for each category
    for (const [category, issues] of categoryIssues.entries()) {
      const fixes = issues
        .map(issue => this.generateFixForIssue(issue, pages))
        .filter((fix): fix is FixSuggestion => fix !== null);

      if (fixes.length > 0) {
        bulkFixes.push({
          category,
          affectedPages: new Set(issues.map(i => i.url)).size,
          fixes,
          estimatedImpact: this.estimateImpact(category, fixes.length),
        });
      }
    }

    return bulkFixes;
  }

  /**
   * Generate internal link suggestions
   */
  generateInternalLinkSuggestions(pages: PageData[]): InternalLinkSuggestion[] {
    const suggestions: InternalLinkSuggestion[] = [];
    
    // Build keyword map from page content
    const pageKeywords = new Map<string, Set<string>>();
    
    for (const page of pages) {
      const keywords = this.extractKeywords(page);
      pageKeywords.set(page.url, keywords);
    }

    // Find linking opportunities
    for (const sourcePage of pages) {
      const sourceKeywords = pageKeywords.get(sourcePage.url) || new Set();
      const existingLinks = new Set(sourcePage.links.map(l => l.href));

      for (const targetPage of pages) {
        if (sourcePage.url === targetPage.url) continue;
        if (existingLinks.has(targetPage.url)) continue;

        const targetKeywords = pageKeywords.get(targetPage.url) || new Set();
        
        // Find overlapping keywords
        const overlap = [...sourceKeywords].filter(k => targetKeywords.has(k));
        
        if (overlap.length > 0) {
          const relevanceScore = overlap.length / Math.max(sourceKeywords.size, 1);
          
          if (relevanceScore > 0.1) {
            suggestions.push({
              sourcePage: sourcePage.url,
              targetPage: targetPage.url,
              anchorText: targetPage.h1[0] || targetPage.title || overlap[0],
              context: `Both pages discuss: ${overlap.slice(0, 3).join(", ")}`,
              relevanceScore,
            });
          }
        }
      }
    }

    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50);
  }

  /**
   * Generate content improvement suggestions
   */
  generateContentSuggestions(pages: PageData[]): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];

    for (const page of pages) {
      // Thin content
      if (page.wordCount < 300) {
        suggestions.push({
          url: page.url,
          type: "expand",
          suggestion: `Expand content from ${page.wordCount} to at least 500 words. Add more detailed explanations, examples, or FAQs.`,
          priority: "high",
        });
      }

      // No H2 headings
      if (page.h2.length === 0 && page.wordCount > 200) {
        suggestions.push({
          url: page.url,
          type: "add-heading",
          suggestion: "Add H2 subheadings to break up content and improve readability. Aim for one H2 every 200-300 words.",
          priority: "medium",
        });
      }

      // No images
      if (page.images.length === 0 && page.wordCount > 300) {
        suggestions.push({
          url: page.url,
          type: "add-images",
          suggestion: "Add relevant images to improve engagement and break up text. Include descriptive alt text.",
          priority: "medium",
        });
      }

      // No FAQ potential
      if (page.wordCount > 500 && !page.schemaMarkup.some(s => 
        (s as { "@type"?: string })["@type"] === "FAQPage"
      )) {
        suggestions.push({
          url: page.url,
          type: "add-faq",
          suggestion: "Consider adding an FAQ section with FAQPage schema to target 'People Also Ask' snippets.",
          priority: "low",
        });
      }
    }

    return suggestions;
  }

  // ============================================
  // FIX GENERATORS
  // ============================================

  private generateFixForIssue(issue: AuditIssue, pages: PageData[]): FixSuggestion | null {
    const page = pages.find(p => p.url === issue.url);
    if (!page) return null;

    switch (issue.category) {
      case "meta":
        return this.generateMetaFix(issue, page);
      case "headings":
        return this.generateHeadingFix(issue, page);
      case "images":
        return this.generateImageFix(issue, page);
      case "content":
        return this.generateContentFix(issue, page);
      case "schema":
        return this.generateSchemaFix(issue, page);
      case "links":
        return this.generateLinkFix(issue, page);
      default:
        return null;
    }
  }

  private generateMetaFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("Missing Title")) {
      return {
        issueId: issue.id,
        type: "meta",
        priority: "high",
        title: "Add Title Tag",
        description: "Generate a compelling title tag for this page.",
        currentValue: undefined,
        suggestedValue: this.generateTitle(page),
        code: `<title>${this.generateTitle(page)}</title>`,
        impact: "High - Title tags are crucial for rankings and CTR",
        effort: "easy",
        automated: true,
      };
    }

    if (issue.title.includes("Missing Meta Description")) {
      return {
        issueId: issue.id,
        type: "meta",
        priority: "high",
        title: "Add Meta Description",
        description: "Generate a compelling meta description for this page.",
        currentValue: undefined,
        suggestedValue: this.generateMetaDescription(page),
        code: `<meta name="description" content="${this.generateMetaDescription(page)}" />`,
        impact: "Medium - Meta descriptions affect CTR in search results",
        effort: "easy",
        automated: true,
      };
    }

    if (issue.title.includes("Title Too Short") || issue.title.includes("Title Too Long")) {
      return {
        issueId: issue.id,
        type: "meta",
        priority: "medium",
        title: "Optimize Title Length",
        description: "Adjust title to optimal length (50-60 characters).",
        currentValue: page.title,
        suggestedValue: this.optimizeTitle(page.title),
        code: `<title>${this.optimizeTitle(page.title)}</title>`,
        impact: "Medium - Proper length ensures full display in search results",
        effort: "easy",
        automated: true,
      };
    }

    if (issue.title.includes("Missing Open Graph")) {
      return {
        issueId: issue.id,
        type: "meta",
        priority: "low",
        title: "Add Open Graph Tags",
        description: "Add OG tags for better social media sharing.",
        suggestedValue: "Open Graph meta tags",
        code: this.generateOgTags(page),
        impact: "Low - Improves appearance when shared on social media",
        effort: "easy",
        automated: true,
      };
    }

    return null;
  }

  private generateHeadingFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("Missing H1")) {
      return {
        issueId: issue.id,
        type: "content",
        priority: "high",
        title: "Add H1 Heading",
        description: "Add a primary heading that describes the page content.",
        suggestedValue: this.generateH1(page),
        code: `<h1>${this.generateH1(page)}</h1>`,
        impact: "High - H1 is a key on-page SEO signal",
        effort: "easy",
        automated: true,
      };
    }

    if (issue.title.includes("Multiple H1")) {
      return {
        issueId: issue.id,
        type: "content",
        priority: "medium",
        title: "Fix Multiple H1 Tags",
        description: "Keep one primary H1 and demote others to H2.",
        currentValue: `${page.h1.length} H1 tags`,
        suggestedValue: "Keep: " + (page.h1[0] || ""),
        impact: "Medium - Multiple H1s can confuse search engines",
        effort: "medium",
        automated: false,
      };
    }

    return null;
  }

  private generateImageFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("Missing Alt Text")) {
      const imageSrc = (issue.details?.imageSrc as string) || "";
      return {
        issueId: issue.id,
        type: "content",
        priority: "medium",
        title: "Add Image Alt Text",
        description: "Add descriptive alt text for accessibility and SEO.",
        currentValue: "(empty)",
        suggestedValue: this.generateAltText(imageSrc, page),
        code: `alt="${this.generateAltText(imageSrc, page)}"`,
        impact: "Medium - Alt text helps with image search and accessibility",
        effort: "easy",
        automated: true,
      };
    }

    return null;
  }

  private generateContentFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("Thin Content")) {
      return {
        issueId: issue.id,
        type: "content",
        priority: "high",
        title: "Expand Thin Content",
        description: "Add more comprehensive content to this page.",
        currentValue: `${page.wordCount} words`,
        suggestedValue: "500+ words with valuable information",
        impact: "High - Thin content struggles to rank",
        effort: "hard",
        automated: false,
      };
    }

    if (issue.title.includes("Duplicate")) {
      return {
        issueId: issue.id,
        type: "content",
        priority: "medium",
        title: "Create Unique Content",
        description: "Make this content unique to avoid cannibalization.",
        suggestedValue: "Unique title and meta description",
        impact: "Medium - Duplicate content can hurt rankings",
        effort: "medium",
        automated: true,
      };
    }

    return null;
  }

  private generateSchemaFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("No Schema Markup")) {
      return {
        issueId: issue.id,
        type: "schema",
        priority: "medium",
        title: "Add Schema Markup",
        description: "Add structured data to improve search appearance.",
        suggestedValue: "Article or WebPage schema",
        code: this.generateSchema(page),
        impact: "Medium - Schema can enable rich snippets in search results",
        effort: "easy",
        automated: true,
      };
    }

    if (issue.title.includes("Missing Breadcrumb")) {
      return {
        issueId: issue.id,
        type: "schema",
        priority: "low",
        title: "Add Breadcrumb Schema",
        description: "Add breadcrumb structured data for navigation.",
        suggestedValue: "BreadcrumbList schema",
        code: this.generateBreadcrumbSchema(page),
        impact: "Low - Breadcrumbs improve search result appearance",
        effort: "easy",
        automated: true,
      };
    }

    return null;
  }

  private generateLinkFix(issue: AuditIssue, page: PageData): FixSuggestion | null {
    if (issue.title.includes("Broken Internal Link")) {
      return {
        issueId: issue.id,
        type: "link",
        priority: "high",
        title: "Fix Broken Link",
        description: "Update or remove this broken link.",
        currentValue: issue.details?.brokenLink as string,
        suggestedValue: "Remove or update to valid URL",
        impact: "High - Broken links hurt user experience and crawling",
        effort: "easy",
        automated: false,
      };
    }

    if (issue.title.includes("Orphan Page")) {
      return {
        issueId: issue.id,
        type: "link",
        priority: "medium",
        title: "Add Internal Links",
        description: "Add internal links pointing to this orphan page.",
        suggestedValue: "Add 2-3 internal links from related content",
        impact: "Medium - Orphan pages are hard for search engines to discover",
        effort: "medium",
        automated: false,
      };
    }

    return null;
  }

  // ============================================
  // CONTENT GENERATORS
  // ============================================

  private generateTitle(page: PageData): string {
    if (page.h1[0]) {
      const h1 = page.h1[0];
      if (h1.length <= 60) return h1;
      return h1.slice(0, 57) + "...";
    }
    
    // Extract from URL
    const urlPath = new URL(page.url).pathname;
    const slug = urlPath.split("/").filter(Boolean).pop() || "Home";
    return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateMetaDescription(page: PageData): string {
    // Use first paragraph or combine headings
    const content = page.h1.concat(page.h2).join(". ");
    if (content.length >= 120) {
      return content.slice(0, 155).trim() + "...";
    }
    
    return `Learn about ${page.title || "this topic"}. ${content}`.slice(0, 155).trim();
  }

  private optimizeTitle(title: string): string {
    if (title.length >= 50 && title.length <= 60) return title;
    
    if (title.length < 50) {
      // Pad with brand or additional context
      return (title + " | CabbageSEO").slice(0, 60);
    }
    
    // Truncate
    return title.slice(0, 57) + "...";
  }

  private generateH1(page: PageData): string {
    if (page.title) {
      // Clean up title for H1
      return page.title.replace(/\s*[\|\-–—]\s*[^|\-–—]*$/, "").trim();
    }
    
    const urlPath = new URL(page.url).pathname;
    const slug = urlPath.split("/").filter(Boolean).pop() || "Home";
    return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateAltText(imageSrc: string, page: PageData): string {
    // Extract from filename
    const filename = imageSrc.split("/").pop()?.split("?")[0] || "";
    const name = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    
    if (name.length > 5) {
      return name.replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Fallback to page context
    return `Image from ${page.title || "page"}`;
  }

  private generateOgTags(page: PageData): string {
    return `<meta property="og:title" content="${page.title}" />
<meta property="og:description" content="${page.metaDescription || this.generateMetaDescription(page)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${page.url}" />`;
  }

  private generateSchema(page: PageData): string {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": page.title,
      "description": page.metaDescription || this.generateMetaDescription(page),
      "url": page.url,
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  }

  private generateBreadcrumbSchema(page: PageData): string {
    const url = new URL(page.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    const items = pathParts.map((part, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      "item": `${url.origin}/${pathParts.slice(0, index + 1).join("/")}`,
    }));

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items,
    };

    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
  }

  // ============================================
  // HELPERS
  // ============================================

  private extractKeywords(page: PageData): Set<string> {
    const keywords = new Set<string>();
    
    // From title
    if (page.title) {
      page.title.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 3) keywords.add(w);
      });
    }

    // From headings
    [...page.h1, ...page.h2].forEach(h => {
      h.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 3) keywords.add(w);
      });
    });

    // From meta keywords
    if (page.metaKeywords) {
      page.metaKeywords.split(",").forEach(k => {
        keywords.add(k.trim().toLowerCase());
      });
    }

    return keywords;
  }

  private estimateImpact(category: IssueCategory, issueCount: number): string {
    const impacts: Record<IssueCategory, string> = {
      meta: `Fixing ${issueCount} meta issues could improve CTR by 10-20%`,
      headings: `Fixing ${issueCount} heading issues improves content structure`,
      images: `Fixing ${issueCount} image issues improves accessibility and image search`,
      links: `Fixing ${issueCount} link issues improves crawlability`,
      content: `Fixing ${issueCount} content issues could boost rankings`,
      technical: `Fixing ${issueCount} technical issues improves crawling efficiency`,
      performance: `Fixing ${issueCount} performance issues improves user experience`,
      schema: `Adding schema to ${issueCount} pages could enable rich snippets`,
    };

    return impacts[category] || `${issueCount} issues to fix`;
  }
}

// ============================================
// EXPORTS
// ============================================

export function createAutoFixEngine(): AutoFixEngine {
  return new AutoFixEngine();
}

