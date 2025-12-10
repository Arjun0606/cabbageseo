/**
 * WordPress REST API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating/updating posts and pages
 * - Managing media (images)
 * - Categories and tags
 * - Custom fields (Yoast SEO, RankMath)
 * - Scheduling posts
 * - Fetching existing content
 */

// ============================================
// TYPES
// ============================================

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;  // WordPress Application Password
}

export interface WPPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  status: "publish" | "draft" | "pending" | "private" | "future";
  slug?: string;
  date?: string;  // ISO 8601 for scheduling
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: WPPostMeta;
  author?: number;
}

export interface WPPostMeta {
  // Yoast SEO
  _yoast_wpseo_title?: string;
  _yoast_wpseo_metadesc?: string;
  _yoast_wpseo_focuskw?: string;
  _yoast_wpseo_canonical?: string;
  
  // RankMath
  rank_math_title?: string;
  rank_math_description?: string;
  rank_math_focus_keyword?: string;
  rank_math_canonical_url?: string;
  rank_math_schema_Article?: string;
  
  // Custom
  [key: string]: string | undefined;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
  count: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPMedia {
  id: number;
  source_url: string;
  title: { rendered: string };
  alt_text: string;
  media_type: string;
  mime_type: string;
}

export interface WPPage {
  id: number;
  title: { rendered: string };
  slug: string;
  link: string;
  status: string;
  content: { rendered: string };
}

export interface WPUser {
  id: number;
  name: string;
  slug: string;
}

export interface PublishResult {
  success: boolean;
  postId?: number;
  url?: string;
  error?: string;
}

// ============================================
// WORDPRESS CLIENT
// ============================================

export class WordPressClient {
  private siteUrl: string;
  private authHeader: string;

  constructor(config: WordPressConfig) {
    // Normalize URL
    this.siteUrl = config.siteUrl.replace(/\/$/, "");
    
    // Create Basic Auth header
    const credentials = `${config.username}:${config.applicationPassword}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Test connection to WordPress
   */
  async testConnection(): Promise<{ success: boolean; siteName?: string; error?: string }> {
    try {
      const response = await this.request<{ name: string; url: string }>("/wp-json");
      return { success: true, siteName: response.name };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Connection failed" 
      };
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") 
      ? endpoint 
      : `${this.siteUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `WordPress API error: ${response.status}`
      );
    }

    return response.json();
  }

  // ============================================
  // POSTS
  // ============================================

  /**
   * Create a new post
   */
  async createPost(post: WPPost): Promise<PublishResult> {
    try {
      const result = await this.request<{ id: number; link: string }>(
        "/wp-json/wp/v2/posts",
        {
          method: "POST",
          body: JSON.stringify({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            status: post.status,
            slug: post.slug,
            date: post.date,
            categories: post.categories,
            tags: post.tags,
            featured_media: post.featured_media,
            meta: post.meta,
            author: post.author,
          }),
        }
      );

      return {
        success: true,
        postId: result.id,
        url: result.link,
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
  async updatePost(postId: number, post: Partial<WPPost>): Promise<PublishResult> {
    try {
      const result = await this.request<{ id: number; link: string }>(
        `/wp-json/wp/v2/posts/${postId}`,
        {
          method: "PUT",
          body: JSON.stringify(post),
        }
      );

      return {
        success: true,
        postId: result.id,
        url: result.link,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update post",
      };
    }
  }

  /**
   * Get a post by ID
   */
  async getPost(postId: number): Promise<WPPost & { id: number; link: string }> {
    return this.request(`/wp-json/wp/v2/posts/${postId}`);
  }

  /**
   * List posts
   */
  async listPosts(options: {
    page?: number;
    perPage?: number;
    status?: string;
    search?: string;
    categories?: number[];
    orderby?: string;
    order?: "asc" | "desc";
  } = {}): Promise<Array<WPPost & { id: number; link: string }>> {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.perPage) params.set("per_page", String(options.perPage));
    if (options.status) params.set("status", options.status);
    if (options.search) params.set("search", options.search);
    if (options.categories) params.set("categories", options.categories.join(","));
    if (options.orderby) params.set("orderby", options.orderby);
    if (options.order) params.set("order", options.order);

    return this.request(`/wp-json/wp/v2/posts?${params.toString()}`);
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number, force: boolean = false): Promise<boolean> {
    try {
      await this.request(`/wp-json/wp/v2/posts/${postId}?force=${force}`, {
        method: "DELETE",
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // PAGES
  // ============================================

  /**
   * List pages
   */
  async listPages(options: {
    page?: number;
    perPage?: number;
    status?: string;
  } = {}): Promise<WPPage[]> {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.perPage) params.set("per_page", String(options.perPage));
    if (options.status) params.set("status", options.status);

    return this.request(`/wp-json/wp/v2/pages?${params.toString()}`);
  }

  /**
   * Update a page
   */
  async updatePage(pageId: number, data: Partial<WPPost>): Promise<PublishResult> {
    try {
      const result = await this.request<{ id: number; link: string }>(
        `/wp-json/wp/v2/pages/${pageId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );

      return {
        success: true,
        postId: result.id,
        url: result.link,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update page",
      };
    }
  }

  // ============================================
  // CATEGORIES & TAGS
  // ============================================

  /**
   * List categories
   */
  async listCategories(): Promise<WPCategory[]> {
    return this.request("/wp-json/wp/v2/categories?per_page=100");
  }

  /**
   * Create a category
   */
  async createCategory(name: string, description?: string, parent?: number): Promise<WPCategory> {
    return this.request("/wp-json/wp/v2/categories", {
      method: "POST",
      body: JSON.stringify({ name, description, parent }),
    });
  }

  /**
   * Find or create category by name
   */
  async findOrCreateCategory(name: string): Promise<number> {
    const categories = await this.listCategories();
    const existing = categories.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) return existing.id;
    
    const created = await this.createCategory(name);
    return created.id;
  }

  /**
   * List tags
   */
  async listTags(): Promise<WPTag[]> {
    return this.request("/wp-json/wp/v2/tags?per_page=100");
  }

  /**
   * Create a tag
   */
  async createTag(name: string): Promise<WPTag> {
    return this.request("/wp-json/wp/v2/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Find or create tags by names
   */
  async findOrCreateTags(names: string[]): Promise<number[]> {
    const tags = await this.listTags();
    const ids: number[] = [];

    for (const name of names) {
      const existing = tags.find(
        t => t.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existing) {
        ids.push(existing.id);
      } else {
        const created = await this.createTag(name);
        ids.push(created.id);
      }
    }

    return ids;
  }

  // ============================================
  // MEDIA
  // ============================================

  /**
   * Upload media from URL
   */
  async uploadMediaFromUrl(
    imageUrl: string,
    filename: string,
    altText?: string
  ): Promise<WPMedia | null> {
    try {
      // Fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) return null;

      const imageBlob = await imageResponse.blob();
      const buffer = await imageBlob.arrayBuffer();

      // Upload to WordPress
      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/media`, {
        method: "POST",
        headers: {
          "Authorization": this.authHeader,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": imageBlob.type,
        },
        body: Buffer.from(buffer),
      });

      if (!response.ok) return null;

      const media = await response.json() as WPMedia;

      // Update alt text if provided
      if (altText) {
        await this.request(`/wp-json/wp/v2/media/${media.id}`, {
          method: "PUT",
          body: JSON.stringify({ alt_text: altText }),
        });
      }

      return media;
    } catch {
      return null;
    }
  }

  /**
   * List media
   */
  async listMedia(options: {
    page?: number;
    perPage?: number;
    mediaType?: string;
  } = {}): Promise<WPMedia[]> {
    const params = new URLSearchParams();
    if (options.page) params.set("page", String(options.page));
    if (options.perPage) params.set("per_page", String(options.perPage));
    if (options.mediaType) params.set("media_type", options.mediaType);

    return this.request(`/wp-json/wp/v2/media?${params.toString()}`);
  }

  // ============================================
  // SEO PLUGIN INTEGRATION
  // ============================================

  /**
   * Set Yoast SEO meta
   */
  setYoastMeta(meta: {
    title?: string;
    description?: string;
    focusKeyword?: string;
    canonical?: string;
  }): WPPostMeta {
    return {
      _yoast_wpseo_title: meta.title,
      _yoast_wpseo_metadesc: meta.description,
      _yoast_wpseo_focuskw: meta.focusKeyword,
      _yoast_wpseo_canonical: meta.canonical,
    };
  }

  /**
   * Set RankMath SEO meta
   */
  setRankMathMeta(meta: {
    title?: string;
    description?: string;
    focusKeyword?: string;
    canonical?: string;
    schema?: object;
  }): WPPostMeta {
    return {
      rank_math_title: meta.title,
      rank_math_description: meta.description,
      rank_math_focus_keyword: meta.focusKeyword,
      rank_math_canonical_url: meta.canonical,
      rank_math_schema_Article: meta.schema ? JSON.stringify(meta.schema) : undefined,
    };
  }

  // ============================================
  // USERS
  // ============================================

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<WPUser> {
    return this.request("/wp-json/wp/v2/users/me");
  }

  /**
   * List users
   */
  async listUsers(): Promise<WPUser[]> {
    return this.request("/wp-json/wp/v2/users?per_page=100");
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Publish content with full SEO setup
   */
  async publishWithSEO(options: {
    title: string;
    content: string;
    excerpt?: string;
    slug?: string;
    status?: "publish" | "draft" | "future";
    scheduledDate?: string;
    categoryNames?: string[];
    tagNames?: string[];
    featuredImageUrl?: string;
    seoMeta?: {
      title?: string;
      description?: string;
      focusKeyword?: string;
      canonical?: string;
    };
    seoPlugin?: "yoast" | "rankmath" | "none";
  }): Promise<PublishResult> {
    try {
      // Prepare category IDs
      let categoryIds: number[] = [];
      if (options.categoryNames?.length) {
        categoryIds = await Promise.all(
          options.categoryNames.map(name => this.findOrCreateCategory(name))
        );
      }

      // Prepare tag IDs
      let tagIds: number[] = [];
      if (options.tagNames?.length) {
        tagIds = await this.findOrCreateTags(options.tagNames);
      }

      // Upload featured image if provided
      let featuredMediaId: number | undefined;
      if (options.featuredImageUrl) {
        const filename = options.slug 
          ? `${options.slug}-featured.jpg`
          : `featured-${Date.now()}.jpg`;
        const media = await this.uploadMediaFromUrl(
          options.featuredImageUrl,
          filename,
          options.title
        );
        if (media) {
          featuredMediaId = media.id;
        }
      }

      // Build SEO meta based on plugin
      let meta: WPPostMeta = {};
      if (options.seoMeta && options.seoPlugin !== "none") {
        if (options.seoPlugin === "rankmath") {
          meta = this.setRankMathMeta(options.seoMeta);
        } else {
          // Default to Yoast
          meta = this.setYoastMeta(options.seoMeta);
        }
      }

      // Create the post
      const post: WPPost = {
        title: options.title,
        content: options.content,
        excerpt: options.excerpt,
        slug: options.slug,
        status: options.status || "draft",
        date: options.scheduledDate,
        categories: categoryIds.length > 0 ? categoryIds : undefined,
        tags: tagIds.length > 0 ? tagIds : undefined,
        featured_media: featuredMediaId,
        meta,
      };

      return this.createPost(post);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish",
      };
    }
  }

  /**
   * Update existing content with SEO
   */
  async updateWithSEO(
    postId: number,
    options: {
      title?: string;
      content?: string;
      excerpt?: string;
      seoMeta?: {
        title?: string;
        description?: string;
        focusKeyword?: string;
      };
      seoPlugin?: "yoast" | "rankmath" | "none";
    }
  ): Promise<PublishResult> {
    const updateData: Partial<WPPost> = {};
    
    if (options.title) updateData.title = options.title;
    if (options.content) updateData.content = options.content;
    if (options.excerpt) updateData.excerpt = options.excerpt;

    if (options.seoMeta && options.seoPlugin !== "none") {
      if (options.seoPlugin === "rankmath") {
        updateData.meta = this.setRankMathMeta(options.seoMeta);
      } else {
        updateData.meta = this.setYoastMeta(options.seoMeta);
      }
    }

    return this.updatePost(postId, updateData);
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createWordPressClient(config: WordPressConfig): WordPressClient {
  return new WordPressClient(config);
}
