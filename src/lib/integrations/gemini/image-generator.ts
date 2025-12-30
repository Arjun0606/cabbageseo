/**
 * Nano Banana - Gemini Image Generation
 * 
 * Uses Gemini's native image generation capabilities for:
 * - Featured images for blog posts
 * - Content illustrations
 * - Social media images
 * 
 * @see https://ai.google.dev/gemini-api/docs/nanobanana
 */

// ============================================
// TYPES
// ============================================

export interface ImageGenerationOptions {
  prompt: string;
  model?: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview";
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2";
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
  prompt: string;
}

// ============================================
// NANO BANANA CLIENT
// ============================================

export class NanoBananaClient {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
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
      model = "gemini-2.5-flash-image",
    } = options;

    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Nano Banana] Error:", error);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Find the image part in the response
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data: string; mimeType: string } }) => part.inlineData
    );

    if (!imagePart?.inlineData) {
      throw new Error("No image generated");
    }

    return {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
      prompt,
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
      professional: "clean, modern, professional, corporate style, subtle colors",
      creative: "vibrant, creative, artistic, eye-catching, dynamic",
      minimal: "minimalist, simple, elegant, white space, modern",
    };

    const prompt = `Create a featured image for a blog post titled "${title}" about ${topic}. 
Style: ${styleGuides[style]}. 
The image should be suitable for a tech/business blog, with no text in the image.
High quality, 16:9 aspect ratio.`;

    return this.generateImage({ prompt });
  }

  /**
   * Generate an illustration for content
   */
  async generateIllustration(
    concept: string,
    context: string
  ): Promise<GeneratedImage> {
    const prompt = `Create an illustration that visually explains "${concept}" in the context of ${context}. 
Modern, clean style suitable for a tech blog. 
No text, just visual representation. 
Professional quality.`;

    return this.generateImage({ prompt });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const nanoBanana = new NanoBananaClient();

/**
 * Create a new client with custom API key
 */
export function createNanoBananaClient(apiKey: string): NanoBananaClient {
  return new NanoBananaClient(apiKey);
}

