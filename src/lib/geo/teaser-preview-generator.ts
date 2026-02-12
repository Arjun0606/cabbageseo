/**
 * Teaser Content Preview Generator
 *
 * Generates a sample "fix page" preview for the free scan report.
 * Shows users what AI-optimized content looks like — the hook that
 * convinces them to subscribe.
 *
 * Cost: ~$0.003 per generation (gpt-5-mini)
 * Time: ~2-4 seconds
 */

export interface ContentPreviewData {
  title: string;
  metaDescription: string;
  firstParagraph: string;
  blurredBody: string;
  faqItems: Array<{ question: string; answer: string }>;
  wordCount: number;
  brandUsed: string;
  generatedAt: string;
}

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

export async function generateTeaserPreview(
  domain: string,
  _otherBrands: string[],
  brandName: string,
  businessSummary?: string,
): Promise<ContentPreviewData | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[TeaserPreview] OpenAI API key not configured");
    return null;
  }

  const systemPrompt = `You are an AI visibility content strategist. You create authority-building pages that ChatGPT, Perplexity, and Google AI will cite when users ask questions. You respond ONLY with valid JSON. No markdown code fences.`;

  const userPrompt = `Generate a sample fix page preview for: "${brandName}"

CONTEXT:
- Domain: ${domain}
${businessSummary ? `- What they do: ${businessSummary}` : ""}
- This is a PREVIEW to show users what AI-optimized content looks like before they subscribe

INSTRUCTIONS:
1. Pick a realistic query that a potential customer of ${brandName} would ask AI (e.g. "best [category] for [use case]")
2. Write a compelling SEO title (60-70 chars) targeting that query
3. Write a meta description (150-160 chars)
4. Write an opening paragraph (80-120 words) that directly answers the query — position ${brandName} as a knowledgeable authority, not just promotional
5. Write a body section (200-300 words) with ## headings, real substance, and specific detail
6. Write 4 FAQ questions that real users would ask, with concise answers (2-3 sentences each)
7. Make it genuinely useful — this needs to convince people the content is worth paying for

Respond in this exact JSON format:
{
  "title": "SEO title here",
  "metaDescription": "Meta description here",
  "firstParagraph": "Opening paragraph in markdown",
  "body": "Rest of the content in markdown (## headings, bullet points, etc.)",
  "faqItems": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"},
    {"question": "Q3?", "answer": "A3"},
    {"question": "Q4?", "answer": "A4"}
  ]
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 8000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[TeaserPreview] OpenAI error:", response.status);
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    if (!rawContent) {
      console.error("[TeaserPreview] Empty response from OpenAI");
      return null;
    }

    const cleaned = extractJSON(rawContent);
    const parsed = JSON.parse(cleaned);

    const fullBody = `${parsed.firstParagraph || ""}\n\n${parsed.body || ""}`;
    const wordCount = fullBody.split(/\s+/).filter(Boolean).length;

    return {
      title: parsed.title || `${brandName}: The Complete Guide`,
      metaDescription: parsed.metaDescription || `Everything you need to know about ${brandName}.`,
      firstParagraph: parsed.firstParagraph || "",
      blurredBody: parsed.body || "",
      faqItems: (parsed.faqItems || []).slice(0, 4),
      wordCount,
      brandUsed: brandName,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[TeaserPreview] Generation failed:", error);
    return null;
  }
}
