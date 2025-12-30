/**
 * HubSpot CMS API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating/updating blog posts
 * - Managing blog authors
 * - Publishing content
 * - SEO optimization
 */

// ============================================
// TYPES
// ============================================

export interface HubSpotConfig {
  accessToken: string;       // Private app access token
  portalId?: string;         // HubSpot portal ID
}

export interface HubSpotBlogPost {
  id?: string;
  name: string;              // Title
  slug?: string;
  state?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  authorName?: string;
  contentGroupId?: string;   // Blog ID
  postBody?: string;
  postSummary?: string;
  featuredImage?: string;
  metaDescription?: string;
  htmlTitle?: string;
  publishDate?: string;
  useFeaturedImage?: boolean;
  tagIds?: number[];
  campaign?: string;
  enableGoogleAmpOutputOverride?: boolean;
}

export interface HubSpotBlog {
  id: string;
  name: string;
  slug: string;
  language: string;
}

export interface HubSpotTag {
  id: number;
  name: string;
  slug: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

// ============================================
// HUBSPOT CLIENT
// ============================================

export class HubSpotClient {
  private token: string;
  private portalId?: string;
  private baseUrl = "https://api.hubapi.com";

  constructor(config: HubSpotConfig) {
    this.token = config.accessToken;
    this.portalId = config.portalId;
  }

  /**
   * Make authenticated request to HubSpot API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HubSpot API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test connection to HubSpot
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/integrations/v1/me");
      return true;
    } catch (error) {
      console.error("HubSpot connection test failed:", error);
      return false;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo(): Promise<{ portalId: number; accountType: string }> {
    return this.request("/integrations/v1/me");
  }

  // ============================================
  // BLOGS
  // ============================================

  /**
   * List all blogs
   */
  async listBlogs(): Promise<HubSpotBlog[]> {
    const response = await this.request<{ results: HubSpotBlog[] }>(
      "/cms/v3/blogs/posts"
    );
    return response.results || [];
  }

  /**
   * Get blog by ID
   */
  async getBlog(blogId: string): Promise<HubSpotBlog> {
    return this.request(`/cms/v3/blogs/${blogId}`);
  }

  // ============================================
  // BLOG POSTS
  // ============================================

  /**
   * List blog posts
   */
  async listPosts(options: {
    limit?: number;
    offset?: number;
    state?: "DRAFT" | "PUBLISHED" | "SCHEDULED";
    contentGroupId?: string;
  } = {}): Promise<HubSpotBlogPost[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));
    if (options.state) params.set("state", options.state);
    if (options.contentGroupId) params.set("contentGroupId", options.contentGroupId);

    const response = await this.request<{ results: HubSpotBlogPost[] }>(
      `/cms/v3/blogs/posts?${params.toString()}`
    );
    return response.results || [];
  }

  /**
   * Get a single post
   */
  async getPost(postId: string): Promise<HubSpotBlogPost> {
    return this.request(`/cms/v3/blogs/posts/${postId}`);
  }

  /**
   * Create a blog post
   */
  async createPost(post: Omit<HubSpotBlogPost, "id">): Promise<PublishResult> {
    try {
      const response = await this.request<{ id: string; url: string }>(
        "/cms/v3/blogs/posts",
        {
          method: "POST",
          body: JSON.stringify(post),
        }
      );

      return {
        success: true,
        postId: response.id,
        url: response.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create post",
      };
    }
  }

  /**
   * Update a blog post
   */
  async updatePost(postId: string, post: Partial<HubSpotBlogPost>): Promise<PublishResult> {
    try {
      const response = await this.request<{ id: string; url: string }>(
        `/cms/v3/blogs/posts/${postId}`,
        {
          method: "PATCH",
          body: JSON.stringify(post),
        }
      );

      return {
        success: true,
        postId: response.id,
        url: response.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update post",
      };
    }
  }

  /**
   * Delete a blog post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.request(`/cms/v3/blogs/posts/${postId}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Publish a draft post
   */
  async publishPost(postId: string): Promise<PublishResult> {
    return this.updatePost(postId, { state: "PUBLISHED" });
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
    authorName?: string;
    featuredImage?: string;
    blogId?: string;
    seoMeta?: {
      title?: string;
      description?: string;
    };
  }): Promise<PublishResult> {
    const post: Omit<HubSpotBlogPost, "id"> = {
      name: options.title,
      slug: options.slug,
      postBody: options.content,
      postSummary: options.excerpt,
      state: options.status === "published" ? "PUBLISHED" : "DRAFT",
      authorName: options.authorName,
      featuredImage: options.featuredImage,
      contentGroupId: options.blogId,
      htmlTitle: options.seoMeta?.title || options.title,
      metaDescription: options.seoMeta?.description || options.excerpt,
      useFeaturedImage: !!options.featuredImage,
    };

    return this.createPost(post);
  }

  // ============================================
  // TAGS
  // ============================================

  /**
   * List blog tags
   */
  async listTags(): Promise<HubSpotTag[]> {
    const response = await this.request<{ results: HubSpotTag[] }>(
      "/cms/v3/blogs/tags"
    );
    return response.results || [];
  }

  /**
   * Create a tag
   */
  async createTag(name: string): Promise<HubSpotTag> {
    return this.request(
      "/cms/v3/blogs/tags",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    );
  }

  /**
   * Find or create a tag by name
   */
  async findOrCreateTag(name: string): Promise<HubSpotTag> {
    const tags = await this.listTags();
    const existing = tags.find(t => 
      t.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) return existing;
    
    return this.createTag(name);
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createHubSpotClient(config: HubSpotConfig): HubSpotClient {
  return new HubSpotClient(config);
}

