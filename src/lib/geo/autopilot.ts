/**
 * GEO Autopilot Engine
 * 
 * Automatic weekly content generation optimized for AI citations.
 * 
 * Flow:
 * 1. Find sites with autopilot enabled
 * 2. Check if it's time to generate (based on frequency)
 * 3. Generate GEO-optimized article
 * 4. Publish to connected CMS
 * 5. Track and report
 * 
 * "Set it and forget it. We get you cited by AI."
 */

import { createServiceClient } from "@/lib/supabase/server";
import { openai } from "@/lib/ai/openai-client";
import { dalle } from "@/lib/ai/image-generator";
import { ContentPipeline } from "@/lib/ai/content-pipeline";

// ============================================
// TYPES
// ============================================

interface AutopilotSite {
  id: string;
  domain: string;
  name: string;
  topics: string[];
  autopilot_enabled: boolean;
  autopilot_frequency: "daily" | "weekly" | "biweekly";
  last_autopilot_run: string | null;
  organization_id: string;
}

interface AutopilotResult {
  siteId: string;
  domain: string;
  success: boolean;
  articleTitle?: string;
  articleId?: string;
  publishedTo?: string;
  geoScore?: number;
  error?: string;
}

// ============================================
// GEO-OPTIMIZED CONTENT STRUCTURE
// ============================================

const GEO_ARTICLE_TEMPLATE = `
You are creating content optimized for AI citations (GEO - Generative Engine Optimization).

Your content MUST include these elements that make AI cite you:

1. **CLEAR ANSWER FIRST** (First 2 sentences)
   - Direct answer to the topic question
   - AI extracts this for citations

2. **EXPERT ATTRIBUTION**
   - Include quotes or references to experts
   - "According to [expert/study]..."
   - This builds trust for AI

3. **STRUCTURED DATA**
   - Use clear headings (H2, H3)
   - Include a table or list
   - Add an FAQ section at the end

4. **ENTITY-RICH CONTENT**
   - Name specific tools, people, companies
   - Include statistics and dates
   - Reference authoritative sources

5. **QUOTABLE SNIPPETS**
   - Short, punchy statements AI can extract
   - Definitions that can be directly quoted
   - Key takeaways in bullet points

6. **FAQ SECTION** (Required)
   - 4-6 common questions
   - Direct, concise answers
   - Perfect for AI to cite

DO NOT:
- Write fluffy introductions
- Use vague language
- Bury the answer at the end
- Skip the FAQ section
`;

// ============================================
// AUTOPILOT ENGINE
// ============================================

export class GEOAutopilot {
  private contentPipeline: ContentPipeline;

  constructor() {
    this.contentPipeline = new ContentPipeline();
  }

  /**
   * Run autopilot for all eligible sites
   */
  async runAutopilot(): Promise<AutopilotResult[]> {
    const supabase = await createServiceClient();
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return [];
    }

    // Get sites with autopilot enabled
    const { data: sites, error } = await supabase
      .from("sites")
      .select("*")
      .eq("autopilot_enabled", true)
      .eq("status", "active");

    if (error || !sites) {
      console.error("Error fetching autopilot sites:", error);
      return [];
    }

    const results: AutopilotResult[] = [];

    for (const site of sites as AutopilotSite[]) {
      // Check if it's time to run
      if (!this.shouldRun(site)) {
        continue;
      }

      try {
        const result = await this.generateForSite(site);
        results.push(result);

        // Update last run time
        await (supabase as any)
          .from("sites")
          .update({ last_autopilot_run: new Date().toISOString() })
          .eq("id", site.id);
      } catch (error) {
        console.error(`Autopilot error for ${site.domain}:`, error);
        results.push({
          siteId: site.id,
          domain: site.domain,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Check if site should run based on frequency
   */
  private shouldRun(site: AutopilotSite): boolean {
    if (!site.last_autopilot_run) {
      return true; // Never run before
    }

    const lastRun = new Date(site.last_autopilot_run);
    const now = new Date();
    const daysSinceLastRun = (now.getTime() - lastRun.getTime()) / (24 * 60 * 60 * 1000);

    switch (site.autopilot_frequency) {
      case "daily":
        return daysSinceLastRun >= 1;
      case "weekly":
        return daysSinceLastRun >= 7;
      case "biweekly":
        return daysSinceLastRun >= 14;
      default:
        return daysSinceLastRun >= 7;
    }
  }

  /**
   * Generate GEO-optimized content for a site
   */
  async generateForSite(site: AutopilotSite): Promise<AutopilotResult> {
    // Step 1: Generate topic based on site's topics and gaps
    const topic = await this.generateTopic(site);

    // Step 2: Generate GEO-optimized article
    const article = await this.generateGEOArticle(site, topic);

    // Step 3: Generate featured image
    let imageUrl: string | undefined;
    try {
      if (dalle.isConfigured()) {
        const image = await dalle.generateFeaturedImage(
          article.title,
          topic,
          "professional"
        );
        imageUrl = image.url;
      }
    } catch (error) {
      console.warn("Image generation failed:", error);
    }

    // Step 4: Save to database
    const supabase = await createServiceClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    const { data: content, error: contentError } = await (supabase as any)
      .from("content")
      .insert({
        site_id: site.id,
        organization_id: site.organization_id,
        title: article.title,
        slug: this.slugify(article.title),
        body: article.body,
        body_html: article.bodyHtml,
        meta_title: article.metaTitle,
        meta_description: article.metaDescription,
        featured_image: imageUrl,
        status: "draft", // Ready for review or auto-publish
        content_type: "article",
        geo_score: article.geoScore,
        word_count: article.wordCount,
        source: "autopilot",
      })
      .select("id")
      .single();

    if (contentError) {
      throw new Error(`Failed to save content: ${contentError.message}`);
    }

    // Step 5: Try to publish to CMS if connected
    let publishedTo: string | undefined;
    // TODO: Integrate with CMS publisher

    return {
      siteId: site.id,
      domain: site.domain,
      success: true,
      articleTitle: article.title,
      articleId: content.id,
      publishedTo,
      geoScore: article.geoScore,
    };
  }

  /**
   * Generate a topic based on site's focus areas
   */
  private async generateTopic(site: AutopilotSite): Promise<string> {
    const topics = site.topics || [];
    
    const prompt = `Generate a single article topic for ${site.domain}.

Site topics: ${topics.join(", ") || "general"}

Requirements:
1. Topic should be highly likely to get cited by AI search (ChatGPT, Perplexity)
2. Should answer a question people ask AI
3. Should be specific and actionable
4. Avoid topics that are too broad or too niche

Return just the topic title, nothing else.

Examples of good GEO topics:
- "What is [X] and How Does It Work?"
- "Complete Guide to [X]: Everything You Need to Know"
- "[X] vs [Y]: Which is Better in 2025?"
- "How to [Achieve Goal] Using [Method]"
- "Top 10 [Things] for [Audience] in 2025"`;

    const result = await openai.chat(
      [{ role: "user", content: prompt }],
      "You are a GEO content strategist. Generate topics that AI will cite.",
      { model: "gpt-5-mini", maxTokens: 100 }
    );

    return result.content.trim().replace(/^["']|["']$/g, "");
  }

  /**
   * Generate a GEO-optimized article
   */
  private async generateGEOArticle(
    site: AutopilotSite,
    topic: string
  ): Promise<{
    title: string;
    metaTitle: string;
    metaDescription: string;
    body: string;
    bodyHtml: string;
    geoScore: number;
    wordCount: number;
  }> {
    const prompt = `${GEO_ARTICLE_TEMPLATE}

Write a comprehensive article about: "${topic}"
For website: ${site.domain}

Requirements:
- 1500-2000 words
- Start with a clear, quotable answer (2 sentences max)
- Include 4-6 H2 sections
- Add a table or comparison if relevant
- Include 5 FAQ questions with concise answers at the end
- Use markdown formatting

Return JSON:
{
  "title": "Article Title",
  "metaTitle": "SEO Title (60 chars max)",
  "metaDescription": "Meta description (155 chars max)",
  "body": "Full article in markdown",
  "geoScore": 0-100
}`;

    const result = await openai.getJSON<{
      title: string;
      metaTitle: string;
      metaDescription: string;
      body: string;
      geoScore: number;
    }>(prompt);

    // Convert markdown to HTML
    const bodyHtml = this.markdownToHtml(result.body);
    const wordCount = result.body.split(/\s+/).length;

    return {
      ...result,
      bodyHtml,
      wordCount,
    };
  }

  /**
   * Simple markdown to HTML conversion
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      // Headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Lists
      .replace(/^\- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
      .replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
      // Paragraphs
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith("<")) return match;
        return `<p>${match}</p>`;
      })
      // Clean up
      .replace(/<p><\/p>/g, "")
      .replace(/<p>(<h[1-6]>)/g, "$1")
      .replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  }

  /**
   * Create URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100);
  }

  /**
   * Run autopilot for a specific site (manual trigger)
   */
  async runForSite(siteId: string): Promise<AutopilotResult> {
    const supabase = await createServiceClient();
    if (!supabase) {
      throw new Error("Failed to create Supabase client");
    }

    const { data: site, error } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (error || !site) {
      throw new Error("Site not found");
    }

    return this.generateForSite(site as AutopilotSite);
  }
}

// ============================================
// SINGLETON
// ============================================

export const geoAutopilot = new GEOAutopilot();

