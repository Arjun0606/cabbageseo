/**
 * SEO-Optimized Prompt Templates for CabbageSEO
 * 
 * These prompts are carefully crafted for:
 * - Consistent, high-quality output
 * - Proper JSON parsing
 * - SEO best practices
 * - Cost efficiency (minimal tokens)
 */

// ============================================
// KEYWORD RESEARCH PROMPTS
// ============================================

export const PROMPTS = {
  /**
   * Cluster keywords into topical groups
   * Model: Haiku (fast, cheap)
   */
  clusterKeywords: (keywords: string[]) => ({
    system: `You are an expert SEO strategist specializing in topic clustering and content architecture.
Rules:
- Return ONLY valid JSON array
- No markdown, no explanation
- Group by search intent and topic relevance`,
    user: `Analyze and cluster these keywords into topical groups:

${keywords.join("\n")}

For each cluster provide:
1. Name: Descriptive topic name
2. Pillar keyword: Main high-intent keyword
3. Supporting keywords: Related terms
4. Suggested articles: Number of articles to cover cluster

Return JSON array:
[{
  "name": "Topic Name",
  "pillarKeyword": "main keyword",
  "keywords": ["kw1", "kw2", "kw3"],
  "intent": "informational|commercial|transactional|navigational",
  "suggestedArticles": 3,
  "difficulty": "easy|medium|hard"
}]`,
  }),

  /**
   * Generate content ideas from a seed topic
   * Model: Haiku (fast ideation)
   */
  generateContentIdeas: (topic: string, existingTitles: string[] = [], count: number = 10) => ({
    system: `You are an SEO content strategist. Generate unique, search-optimized content ideas.
Rules:
- Return ONLY valid JSON array
- Ideas must be unique and not overlap with existing content
- Focus on topics with clear search intent`,
    user: `Generate ${count} SEO content ideas for: "${topic}"

${existingTitles.length > 0 ? `Existing articles (avoid similar topics):\n${existingTitles.slice(0, 10).join("\n")}\n` : ""}

For each idea provide:
- title: Compelling, click-worthy title (50-60 chars)
- keyword: Primary target keyword
- intent: Search intent type
- difficulty: Estimated ranking difficulty
- trafficPotential: low/medium/high

Return JSON array:
[{
  "title": "Article Title Here",
  "keyword": "target keyword",
  "intent": "informational",
  "difficulty": "easy",
  "trafficPotential": "high"
}]`,
  }),

  // ============================================
  // CONTENT GENERATION PROMPTS
  // ============================================

  /**
   * Generate content outline
   * Model: Sonnet (quality planning)
   */
  generateOutline: (
    keyword: string,
    serpResults: Array<{ title: string; snippet: string }>,
    wordCount: number = 2000
  ) => ({
    system: `You are an expert SEO content strategist. Create comprehensive, well-structured outlines.
Rules:
- Return ONLY valid JSON
- Outlines should be better and more comprehensive than competitors
- Include unique angles not covered by top results`,
    user: `Create an SEO-optimized content outline for: "${keyword}"

Top-ranking competitors:
${serpResults.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n\n")}

Target: ${wordCount} words

Return JSON:
{
  "title": "Compelling article title (55-60 chars)",
  "metaTitle": "SEO title with keyword (max 60 chars)",
  "metaDescription": "Compelling description with keyword (max 155 chars)",
  "headings": [
    {
      "level": 2,
      "text": "Heading text",
      "points": ["Point to cover", "Another point"],
      "wordCount": 300
    }
  ],
  "faqs": [
    {"question": "FAQ question?", "answer": "Brief answer preview"}
  ],
  "uniqueAngles": ["What makes this better than competitors"],
  "internalLinkOpportunities": ["related topic 1", "related topic 2"]
}`,
  }),

  /**
   * Generate full article from outline
   * Model: Sonnet (quality content)
   */
  generateArticle: (
    keyword: string,
    outline: {
      title: string;
      headings: Array<{ level: number; text: string; points: string[] }>;
      faqs?: Array<{ question: string; answer: string }>;
    },
    brandVoice?: string,
    wordCount: number = 2000
  ) => ({
    system: `You are an expert SEO content writer with years of experience creating high-ranking content.

Writing rules:
- Write naturally, avoid keyword stuffing
- Use short paragraphs (2-3 sentences)
- Include practical examples and actionable advice
- Make content scannable with bullet points
- Use markdown formatting
- Maintain consistent tone throughout
- Include statistics and data where relevant
- Write for humans first, search engines second

${brandVoice ? `Brand voice: ${brandVoice}` : "Voice: Professional, engaging, authoritative but approachable"}`,
    user: `Write a comprehensive ${wordCount}+ word article for: "${keyword}"

Title: ${outline.title}

Outline:
${outline.headings.map(h => `${"#".repeat(h.level)} ${h.text}\n${h.points.map(p => `- ${p}`).join("\n")}`).join("\n\n")}

${outline.faqs ? `\nInclude these FAQs at the end:\n${outline.faqs.map(f => `Q: ${f.question}`).join("\n")}` : ""}

Requirements:
1. Follow the outline structure exactly
2. Each H2 section should be 200-400 words
3. Include a brief intro (100-150 words) and conclusion (100-150 words)
4. Use H2 and H3 headings appropriately
5. Include FAQ section with detailed answers (50-100 words each)
6. End with a clear call-to-action

Write the complete article now:`,
  }),

  /**
   * Optimize existing content
   * Model: Sonnet (quality rewriting)
   */
  optimizeContent: (
    content: string,
    keyword: string,
    suggestions: string[]
  ) => ({
    system: `You are an expert SEO editor specializing in content optimization.
Your task is to improve content while maintaining its original voice and structure.`,
    user: `Optimize this content for the keyword: "${keyword}"

Current content:
${content.slice(0, 6000)}${content.length > 6000 ? "\n...[truncated]" : ""}

Issues to fix:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Instructions:
1. Fix all listed issues
2. Improve keyword placement (natural, not forced)
3. Enhance readability
4. Keep the same structure and tone
5. Add relevant subheadings if missing

Return ONLY the optimized content, no explanations.`,
  }),

  // ============================================
  // META & TECHNICAL SEO PROMPTS
  // ============================================

  /**
   * Generate meta tags
   * Model: Haiku (fast, simple task)
   */
  generateMeta: (content: string, keyword: string) => ({
    system: `You are an SEO expert specializing in meta tag optimization.
Rules:
- Return ONLY valid JSON
- Meta title: max 60 characters, include keyword near start
- Meta description: max 155 characters, compelling, include keyword`,
    user: `Generate optimized meta tags for this content.

Target keyword: "${keyword}"

Content preview:
${content.slice(0, 1500)}

Return JSON:
{
  "metaTitle": "Title with keyword | Brand (max 60 chars)",
  "metaDescription": "Compelling description with keyword, action-oriented (max 155 chars)"
}`,
  }),

  /**
   * Suggest internal links
   * Model: Haiku (fast analysis)
   */
  suggestInternalLinks: (
    content: string,
    availablePages: Array<{ url: string; title: string; keywords?: string[] }>
  ) => ({
    system: `You are an SEO expert specializing in internal linking strategy.
Rules:
- Return ONLY valid JSON array
- Only suggest relevant, contextual links
- Use natural anchor text from the content
- Max 5-7 internal links per article`,
    user: `Suggest internal links for this content.

Content:
${content.slice(0, 3000)}

Available pages to link:
${availablePages.slice(0, 20).map(p => `- ${p.title} (${p.url})${p.keywords ? ` - Topics: ${p.keywords.slice(0, 3).join(", ")}` : ""}`).join("\n")}

Return JSON array:
[{
  "anchor": "exact text from content to use as anchor",
  "url": "/target-url",
  "relevance": "high|medium",
  "context": "Why this link helps the reader"
}]`,
  }),

  /**
   * Generate FAQ schema
   * Model: Haiku (extraction task)
   */
  generateFAQs: (content: string, keyword: string, count: number = 5) => ({
    system: `You are an SEO expert specializing in structured data and FAQ optimization.
Rules:
- Return ONLY valid JSON array
- Questions should be natural search queries
- Answers should be comprehensive (50-150 words each)`,
    user: `Generate ${count} SEO-optimized FAQs for: "${keyword}"

Based on this content:
${content.slice(0, 3000)}

Requirements:
- Questions people actually search for
- Answers directly from or supported by the content
- Include the keyword naturally when relevant

Return JSON array:
[{
  "question": "Natural question people search for?",
  "answer": "Comprehensive answer with value..."
}]`,
  }),

  // ============================================
  // ANALYSIS PROMPTS
  // ============================================

  /**
   * Score and analyze content
   * Model: Sonnet (thorough analysis)
   */
  analyzeContent: (content: string, keyword: string) => ({
    system: `You are an expert SEO analyst. Provide detailed, actionable content analysis.
Rules:
- Return ONLY valid JSON
- Be specific with suggestions
- Focus on high-impact improvements`,
    user: `Analyze this content for SEO quality.

Target keyword: "${keyword}"
Word count: ${content.split(/\s+/).length}

Content:
${content.slice(0, 4000)}

Analyze and return JSON:
{
  "score": 0-100,
  "strengths": ["Specific strength 1", "Strength 2"],
  "weaknesses": ["Specific issue 1", "Issue 2"],
  "suggestions": [
    {
      "priority": "high|medium|low",
      "category": "keyword|structure|readability|engagement|technical",
      "issue": "What's wrong",
      "fix": "How to fix it"
    }
  ],
  "keywordAnalysis": {
    "primaryKeywordCount": 5,
    "density": "0.8%",
    "placement": "good|needs improvement",
    "variations": ["related terms found"]
  },
  "readability": {
    "level": "easy|moderate|difficult",
    "avgSentenceLength": 15,
    "suggestions": ["Make paragraphs shorter"]
  },
  "competitiveGaps": ["Topics competitors cover that this doesn't"]
}`,
  }),

  /**
   * Analyze site for quick SEO score
   * Model: Haiku (fast scoring)
   */
  quickSiteScore: (
    siteData: {
      title?: string;
      metaDescription?: string;
      h1?: string;
      headings?: string[];
      wordCount?: number;
      hasSchema?: boolean;
      loadTime?: number;
    }
  ) => ({
    system: `You are an SEO expert. Provide a quick site analysis score.
Rules:
- Return ONLY valid JSON
- Score 0-100
- Be concise but specific`,
    user: `Score this page's SEO:

Title: ${siteData.title || "Missing"}
Meta Description: ${siteData.metaDescription || "Missing"}
H1: ${siteData.h1 || "Missing"}
Headings: ${siteData.headings?.length || 0} found
Word Count: ${siteData.wordCount || 0}
Schema Markup: ${siteData.hasSchema ? "Yes" : "No"}
Load Time: ${siteData.loadTime ? `${siteData.loadTime}ms` : "Unknown"}

Return JSON:
{
  "score": 75,
  "grade": "A|B|C|D|F",
  "quickWins": ["Easy fix 1", "Easy fix 2"],
  "criticalIssues": ["Must fix"],
  "breakdown": {
    "content": 80,
    "technical": 70,
    "onPage": 75
  }
}`,
  }),

  /**
   * Generate content plan
   * Model: Haiku (fast planning)
   */
  generateContentPlan: (
    topic: string,
    keywords: string[],
    timeframeDays: number = 30
  ) => ({
    system: `You are an SEO content strategist. Create actionable content plans.
Rules:
- Return ONLY valid JSON
- Prioritize high-impact content first
- Be realistic with timeline`,
    user: `Create a ${timeframeDays}-day content plan for: "${topic}"

Available keywords:
${keywords.slice(0, 20).join("\n")}

Return JSON:
{
  "overview": "Brief strategy summary",
  "contentPieces": [
    {
      "week": 1,
      "title": "Article title",
      "keyword": "target keyword",
      "type": "pillar|supporting|faq|comparison",
      "priority": "high|medium|low",
      "estimatedTraffic": "500-1000/mo",
      "difficulty": "easy|medium|hard"
    }
  ],
  "clusterStrategy": "How pieces connect",
  "expectedResults": "What to expect in 3-6 months"
}`,
  }),
};

// ============================================
// PROMPT HELPERS
// ============================================

/**
 * Get estimated tokens for a prompt
 * Rough estimate: 4 characters = 1 token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate content to fit token budget
 */
export function truncateForTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 20) + "\n...[truncated]";
}

