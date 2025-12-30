/**
 * DALL-E 3 Image Generation
 * 
 * Uses OpenAI's DALL-E 3 for:
 * - Featured images for blog posts
 * - Content illustrations
 * 
 * Using OpenAI since we're already using it for content generation.
 * One provider = simpler billing & fewer API keys.
 * 
 * @see https://openai.com/index/dall-e-3/
 */

// ============================================
// TYPES
// ============================================

export interface ImageGenerationOptions {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
}

// ============================================
// DALL-E CLIENT
// ============================================

export class DallEClient {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
    const { 
      prompt, 
      size = "1792x1024", // 16:9 for blog featured images
      quality = "standard",
      style = "natural",
    } = options;

    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality,
        style,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[DALL-E] Error:", error);
      throw new Error(`Image generation failed: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    
    if (!data.data?.[0]) {
      throw new Error("No image generated");
    }

    return {
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt || prompt,
    };
  }

  /**
   * Generate a featured image for a blog post
   */
  async generateFeaturedImage(
    title: string,
    topic: string,
    style: "professional" | "creative" | "minimal" = "professional"
  ): Promise<GeneratedImage> {
    const styleGuides = {
      professional: "clean, modern, professional corporate style, subtle colors, business appropriate",
      creative: "vibrant, creative, artistic, eye-catching, dynamic colors",
      minimal: "minimalist, simple, elegant, lots of white space, modern and clean",
    };

    const prompt = `Create a featured image for a blog post titled "${title}" about ${topic}. 
Style: ${styleGuides[style]}. 
The image should be suitable for a tech/business blog.
Do not include any text, words, or letters in the image.
High quality, photorealistic or modern illustration style.`;

    return this.generateImage({ 
      prompt,
      size: "1792x1024", // 16:9 aspect ratio
      style: style === "creative" ? "vivid" : "natural",
    });
  }

  /**
   * Generate an illustration for content
   */
  async generateIllustration(
    concept: string,
    context: string
  ): Promise<GeneratedImage> {
    const prompt = `Create an illustration that visually explains the concept of "${concept}" in the context of ${context}. 
Modern, clean design suitable for a tech blog or SaaS website.
Do not include any text, words, or letters in the image.
Professional quality, clear visual metaphor.`;

    return this.generateImage({ 
      prompt,
      size: "1024x1024",
      style: "natural",
    });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const dalle = new DallEClient();

/**
 * Create a new client with custom API key
 */
export function createDallEClient(apiKey: string): DallEClient {
  return new DallEClient(apiKey);
}

