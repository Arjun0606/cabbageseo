/**
 * AI Client for Content Generation
 * Primary: Claude 4.5 (Anthropic) - Latest models
 * Fallback: GPT-4o (OpenAI)
 * 
 * Model Selection:
 * - Claude Sonnet 4.5: Content generation, outlines, optimization (best balance)
 * - Claude Haiku 4.5: Clustering, meta tags, quick tasks (faster, cheaper)
 * - Claude Opus 4.5: Premium content when quality is paramount
 */

type AIModel = 
  | "claude-sonnet-4-5"      // Best balance - $3/$15 per MTok
  | "claude-haiku-4-5"       // Fastest - $1/$5 per MTok  
  | "claude-opus-4-5"        // Premium - $5/$25 per MTok
  | "gpt-4o"                 // OpenAI fallback
  | "gpt-4o-mini";           // OpenAI cheap fallback

interface AIConfig {
  anthropicKey?: string;
  openaiKey?: string;
  defaultModel?: AIModel;
}

interface ContentOutline {
  title: string;
  metaDescription: string;
  headings: Array<{
    level: number;
    text: string;
    points: string[];
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

interface GeneratedContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  body: string;
  outline: ContentOutline;
  wordCount: number;
  readingTime: number;
}

interface KeywordCluster {
  name: string;
  pillarKeyword: string;
  keywords: string[];
  suggestedArticles: number;
}

export class AIClient {
  private anthropicKey: string;
  private openaiKey: string;
  private defaultModel: AIModel;

  constructor(config?: AIConfig) {
    this.anthropicKey = config?.anthropicKey || process.env.ANTHROPIC_API_KEY || "";
    this.openaiKey = config?.openaiKey || process.env.OPENAI_API_KEY || "";
    this.defaultModel = config?.defaultModel || "claude-sonnet-4-5";
  }

  /**
   * Main chat method - routes to appropriate provider
   */
  private async chat(
    messages: Array<{ role: string; content: string }>,
    model: AIModel = this.defaultModel
  ): Promise<string> {
    if (model.startsWith("claude")) {
      return this.chatClaude(messages, model);
    }
    return this.chatOpenAI(messages, model);
  }

  /**
   * Claude API (Anthropic) - Primary provider
   */
  private async chatClaude(
    messages: Array<{ role: string; content: string }>,
    model: AIModel
  ): Promise<string> {
    if (!this.anthropicKey) {
      // Fallback to OpenAI if no Anthropic key
      console.warn("No Anthropic key, falling back to OpenAI");
      return this.chatOpenAI(messages, "gpt-4o");
    }

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }

  /**
   * OpenAI API - Fallback provider
   */
  private async chatOpenAI(
    messages: Array<{ role: string; content: string }>,
    model: AIModel
  ): Promise<string> {
    if (!this.openaiKey) {
      throw new Error("No AI API keys configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Cluster keywords into topical groups
   * Uses Haiku for speed (this is a quick analytical task)
   */
  async clusterKeywords(keywords: string[]): Promise<KeywordCluster[]> {
    const prompt = `You are an SEO expert. Analyze these keywords and group them into topical clusters.

Keywords:
${keywords.join("\n")}

For each cluster:
1. Name the cluster based on the main topic
2. Identify the pillar keyword (highest search intent, broadest topic)
3. List supporting keywords
4. Suggest number of articles needed

Return JSON array:
[{
  "name": "cluster name",
  "pillarKeyword": "main keyword",
  "keywords": ["keyword1", "keyword2"],
  "suggestedArticles": 5
}]

Only return valid JSON, no explanation.`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO expert that returns only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-haiku-4-5" // Fast model for clustering
    );

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      console.error("Failed to parse cluster response:", response);
      return [];
    }
  }

  /**
   * Generate content outline based on SERP analysis
   * Uses Sonnet for quality outline generation
   */
  async generateOutline(
    keyword: string,
    serpResults: Array<{ title: string; description: string }>,
    targetWordCount: number = 2000
  ): Promise<ContentOutline> {
    const prompt = `Create an SEO-optimized content outline for the keyword: "${keyword}"

Top ranking content for reference:
${serpResults.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}`).join("\n")}

Target word count: ${targetWordCount}

Create an outline that:
1. Covers the topic comprehensively
2. Includes unique angles not covered by competitors
3. Has a compelling, click-worthy title
4. Includes FAQ section with 3-5 questions

Return JSON:
{
  "title": "Article title",
  "metaDescription": "155 char meta description",
  "headings": [
    {"level": 2, "text": "Heading text", "points": ["point 1", "point 2"]}
  ],
  "faqs": [
    {"question": "FAQ question?", "answer": "Brief answer"}
  ]
}

Only return valid JSON.`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an expert SEO content strategist. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-sonnet-4-5" // Quality model for outlines
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      console.error("Failed to parse outline:", response);
      throw new Error("Failed to generate outline");
    }
  }

  /**
   * Generate full article content
   * Uses Sonnet for high-quality long-form content
   */
  async generateArticle(
    keyword: string,
    outline: ContentOutline,
    brandVoice?: string
  ): Promise<GeneratedContent> {
    const voiceInstructions = brandVoice
      ? `\n\nBrand voice: ${brandVoice}`
      : "\n\nUse a professional, engaging, and authoritative tone.";

    const prompt = `Write a comprehensive, SEO-optimized article for: "${keyword}"

Title: ${outline.title}
Meta Description: ${outline.metaDescription}

Outline:
${outline.headings.map((h) => `${"#".repeat(h.level)} ${h.text}\n${h.points.map((p) => `- ${p}`).join("\n")}`).join("\n\n")}

${outline.faqs ? `FAQs to include:\n${outline.faqs.map((f) => `Q: ${f.question}`).join("\n")}` : ""}
${voiceInstructions}

Requirements:
1. Write naturally, avoid keyword stuffing
2. Use short paragraphs (2-3 sentences max)
3. Include practical examples and actionable advice
4. Make it scannable with bullet points where appropriate
5. Write 2000+ words
6. Use markdown formatting
7. Include the FAQ section at the end with detailed answers

Write the full article now:`;

    const body = await this.chat(
      [
        { role: "system", content: "You are an expert content writer specializing in SEO-optimized articles. Write comprehensive, engaging content." },
        { role: "user", content: prompt },
      ],
      "claude-sonnet-4-5" // Quality model for article writing
    );

    const wordCount = body.split(/\s+/).length;

    return {
      title: outline.title,
      metaTitle: outline.title.length > 60 ? outline.title.slice(0, 57) + "..." : outline.title,
      metaDescription: outline.metaDescription,
      body,
      outline,
      wordCount,
      readingTime: Math.ceil(wordCount / 200),
    };
  }

  /**
   * Generate meta tags for existing content
   * Uses Haiku for quick meta generation
   */
  async generateMeta(
    content: string,
    keyword: string
  ): Promise<{ metaTitle: string; metaDescription: string }> {
    const prompt = `Generate SEO-optimized meta tags for this content.

Target keyword: ${keyword}

Content (first 1000 chars):
${content.slice(0, 1000)}

Requirements:
- Meta title: max 60 chars, include keyword naturally
- Meta description: max 155 chars, compelling, include keyword

Return JSON:
{"metaTitle": "...", "metaDescription": "..."}`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-haiku-4-5" // Fast model for meta tags
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      return {
        metaTitle: keyword,
        metaDescription: content.slice(0, 155),
      };
    }
  }

  /**
   * Suggest internal links for content
   * Uses Haiku for quick analysis
   */
  async suggestInternalLinks(
    content: string,
    availablePages: Array<{ url: string; title: string; keywords: string[] }>
  ): Promise<Array<{ anchor: string; url: string; context: string }>> {
    const prompt = `Suggest internal links for this content.

Content:
${content.slice(0, 2000)}

Available pages to link to:
${availablePages.slice(0, 20).map((p) => `- ${p.title} (${p.url}) - Keywords: ${p.keywords.join(", ")}`).join("\n")}

For each link suggestion:
1. Identify natural anchor text from the content
2. Match to the most relevant page
3. Explain the context

Return JSON array:
[{"anchor": "anchor text", "url": "/path", "context": "why this link makes sense"}]

Only return valid JSON.`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO expert specializing in internal linking. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-haiku-4-5"
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  /**
   * Generate FAQ schema
   * Uses Haiku for quick extraction
   */
  async generateFAQSchema(
    content: string,
    existingFaqs?: Array<{ question: string; answer: string }>
  ): Promise<Array<{ question: string; answer: string }>> {
    if (existingFaqs && existingFaqs.length > 0) {
      return existingFaqs;
    }

    const prompt = `Extract or generate 5 FAQ questions and answers from this content.

Content:
${content.slice(0, 3000)}

Return JSON array:
[{"question": "Question?", "answer": "Answer..."}]

Questions should be:
1. Natural questions people would ask
2. Directly answerable from the content
3. Valuable for search intent

Only return valid JSON.`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-haiku-4-5"
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  /**
   * Analyze and score content
   * Uses Sonnet for thorough analysis
   */
  async scoreContent(
    content: string,
    targetKeyword: string
  ): Promise<{
    score: number;
    suggestions: string[];
    keywordDensity: number;
    readabilityScore: number;
  }> {
    const wordCount = content.split(/\s+/).length;
    const keywordCount = (content.toLowerCase().match(new RegExp(targetKeyword.toLowerCase(), "g")) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;

    // Calculate readability (simplified Flesch-Kincaid)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));

    const prompt = `Analyze this content for SEO quality.

Target keyword: ${targetKeyword}
Word count: ${wordCount}
Keyword density: ${keywordDensity.toFixed(2)}%

Content (first 2000 chars):
${content.slice(0, 2000)}

Provide:
1. Overall score (0-100)
2. Top 5 specific suggestions to improve

Return JSON:
{"score": 85, "suggestions": ["suggestion 1", "suggestion 2"]}`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-sonnet-4-5"
    );

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let result;
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(response);
      }
      return {
        score: result.score,
        suggestions: result.suggestions,
        keywordDensity,
        readabilityScore,
      };
    } catch {
      return {
        score: 70,
        suggestions: ["Add more content", "Include more variations of the target keyword"],
        keywordDensity,
        readabilityScore,
      };
    }
  }

  /**
   * Rewrite/optimize existing content
   * Uses Sonnet for quality rewriting
   */
  async optimizeContent(
    content: string,
    keyword: string,
    suggestions: string[]
  ): Promise<string> {
    const prompt = `Optimize this content for SEO.

Target keyword: ${keyword}

Current content:
${content}

Issues to fix:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Rewrite the content to:
1. Fix all listed issues
2. Improve readability
3. Maintain the same tone and structure
4. Optimize for the target keyword naturally

Return only the optimized content, no explanations.`;

    return this.chat(
      [
        { role: "system", content: "You are an expert SEO content editor. Return only the optimized content." },
        { role: "user", content: prompt },
      ],
      "claude-sonnet-4-5"
    );
  }

  /**
   * Generate article ideas from a topic
   * Uses Haiku for quick ideation
   */
  async generateArticleIdeas(
    topic: string,
    existingArticles: string[] = [],
    count: number = 10
  ): Promise<Array<{
    title: string;
    keyword: string;
    intent: string;
    difficulty: "easy" | "medium" | "hard";
  }>> {
    const prompt = `Generate ${count} SEO article ideas for the topic: "${topic}"

${existingArticles.length > 0 ? `Existing articles (avoid duplicates):\n${existingArticles.join("\n")}` : ""}

For each idea provide:
1. Compelling title
2. Target keyword
3. Search intent (informational, commercial, transactional)
4. Estimated difficulty (easy, medium, hard)

Return JSON array:
[{"title": "...", "keyword": "...", "intent": "informational", "difficulty": "easy"}]

Only return valid JSON.`;

    const response = await this.chat(
      [
        { role: "system", content: "You are an SEO content strategist. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      "claude-haiku-4-5"
    );

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const ai = new AIClient();
