/**
 * Ghost CMS API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating/updating posts
 * - Managing tags
 * - Publishing content
 * - SEO meta fields
 */

import jwt from "jsonwebtoken";

// ============================================
// TYPES
// ============================================

export interface GhostConfig {
  apiUrl: string;          // e.g., "https://yourblog.ghost.io"
  adminApiKey: string;     // Admin API key from Ghost settings
}

export interface GhostPost {
  id?: string;
  uuid?: string;
  title: string;
  slug?: string;
  html?: string;
  mobiledoc?: string;
  feature_image?: string;
  featured?: boolean;
  status?: "draft" | "published" | "scheduled";
  visibility?: "public" | "members" | "paid";
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  custom_excerpt?: string;
  codeinjection_head?: string;
  codeinjection_foot?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  og_title?: string;
  og_description?: string;
  twitter_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  tags?: Array<{ name: string; slug?: string }>;
  authors?: Array<{ id: string }>;
  primary_author?: { id: string };
  primary_tag?: { name: string };
}

export interface GhostTag {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  feature_image?: string;
  visibility?: "public" | "internal";
  meta_title?: string;
  meta_description?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

// ============================================
// GHOST CLIENT
// ============================================

export class GhostClient {
  private apiUrl: string;
  private adminApiKey: string;
  private keyId: string;
  private keySecret: string;

  constructor(config: GhostConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.adminApiKey = config.adminApiKey;
    
    // Split the API key into ID and secret
    const [id, secret] = config.adminApiKey.split(":");
    this.keyId = id;
    this.keySecret = secret;
  }

  /**
   * Generate JWT token for Ghost Admin API
   */
  private generateToken(): string {
    const now = Math.floor(Date.now() / 1000);
    
    return jwt.sign(
      {
        iat: now,
        exp: now + 5 * 60, // 5 minutes
        aud: "/admin/",
      },
      Buffer.from(this.keySecret, "hex"),
      {
        algorithm: "HS256",
        keyid: this.keyId,
      }
    );
  }

  /**
   * Make authenticated request to Ghost Admin API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.generateToken();
    const url = `${this.apiUrl}/ghost/api/admin${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Ghost ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors?.[0]?.message || 
        `Ghost API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Test connection to Ghost
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/site/");
      return true;
    } catch (error) {
      console.error("Ghost connection test failed:", error);
      return false;
    }
  }

  /**
   * Get site info
   */
  async getSite(): Promise<{ title: string; url: string }> {
    const response = await this.request<{ site: { title: string; url: string } }>("/site/");
    return response.site;
  }

  // ============================================
  // POSTS
  // ============================================

  /**
   * List all posts
   */
  async listPosts(options: {
    limit?: number;
    page?: number;
    filter?: string;
    include?: string;
  } = {}): Promise<GhostPost[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.page) params.set("page", String(options.page));
    if (options.filter) params.set("filter", options.filter);
    if (options.include) params.set("include", options.include);

    const response = await this.request<{ posts: GhostPost[] }>(
      `/posts/?${params.toString()}`
    );
    return response.posts || [];
  }

  /**
   * Get a single post
   */
  async getPost(id: string): Promise<GhostPost> {
    const response = await this.request<{ posts: GhostPost[] }>(
      `/posts/${id}/`
    );
    return response.posts[0];
  }

  /**
   * Create a new post
   */
  async createPost(post: Omit<GhostPost, "id" | "uuid">): Promise<PublishResult> {
    try {
      const response = await this.request<{ posts: GhostPost[] }>(
        "/posts/",
        {
          method: "POST",
          body: JSON.stringify({ posts: [post] }),
        }
      );

      const createdPost = response.posts[0];
      const site = await this.getSite();

      return {
        success: true,
        postId: createdPost.id,
        url: `${site.url}${createdPost.slug}/`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create post",
      };
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, post: Partial<GhostPost>): Promise<PublishResult> {
    try {
      // Get current post to get updated_at
      const current = await this.getPost(id);
      
      const response = await this.request<{ posts: GhostPost[] }>(
        `/posts/${id}/`,
        {
          method: "PUT",
          body: JSON.stringify({
            posts: [{
              ...post,
              updated_at: current.updated_at,
            }],
          }),
        }
      );

      const updatedPost = response.posts[0];
      const site = await this.getSite();

      return {
        success: true,
        postId: updatedPost.id,
        url: `${site.url}${updatedPost.slug}/`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update post",
      };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<boolean> {
    try {
      await this.request(`/posts/${id}/`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Publish content with SEO optimization
   */
  async publishWithSEO(options: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    status?: "draft" | "published";
    tags?: string[];
    featuredImage?: string;
    seoMeta?: {
      title?: string;
      description?: string;
      ogImage?: string;
    };
  }): Promise<PublishResult> {
    const post: Omit<GhostPost, "id" | "uuid"> = {
      title: options.title,
      html: options.content,
      slug: options.slug,
      custom_excerpt: options.excerpt,
      status: options.status || "draft",
      feature_image: options.featuredImage,
      meta_title: options.seoMeta?.title,
      meta_description: options.seoMeta?.description,
      og_image: options.seoMeta?.ogImage,
      og_title: options.seoMeta?.title,
      og_description: options.seoMeta?.description,
      tags: options.tags?.map(name => ({ name })),
    };

    return this.createPost(post);
  }

  // ============================================
  // TAGS
  // ============================================

  /**
   * List all tags
   */
  async listTags(): Promise<GhostTag[]> {
    const response = await this.request<{ tags: GhostTag[] }>("/tags/");
    return response.tags || [];
  }

  /**
   * Create a tag
   */
  async createTag(tag: Omit<GhostTag, "id">): Promise<GhostTag> {
    const response = await this.request<{ tags: GhostTag[] }>(
      "/tags/",
      {
        method: "POST",
        body: JSON.stringify({ tags: [tag] }),
      }
    );
    return response.tags[0];
  }

  /**
   * Find or create a tag by name
   */
  async findOrCreateTag(name: string): Promise<GhostTag> {
    const tags = await this.listTags();
    const existing = tags.find(t => 
      t.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) return existing;
    
    return this.createTag({ name });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createGhostClient(config: GhostConfig): GhostClient {
  return new GhostClient(config);
}

