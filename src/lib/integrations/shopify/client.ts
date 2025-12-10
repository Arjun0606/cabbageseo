/**
 * Shopify Storefront & Admin API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating/updating blog posts
 * - Managing blog articles
 * - Product SEO optimization
 * - Page meta management
 * - Sitemap data
 */

// ============================================
// TYPES
// ============================================

export interface ShopifyConfig {
  shopDomain: string;           // e.g., "mystore.myshopify.com" or "mystore"
  accessToken: string;          // Admin API access token
  apiVersion?: string;          // Default: "2024-01"
}

export interface ShopifyBlog {
  id: number;
  handle: string;
  title: string;
  updated_at: string;
  commentable: string;
  feedburner?: string;
  feedburner_location?: string;
  tags?: string;
}

export interface ShopifyArticle {
  id?: number;
  title: string;
  author: string;
  body_html: string;
  blog_id: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  handle?: string;
  image?: {
    src: string;
    alt?: string;
  };
  metafields?: ShopifyMetafield[];
  summary_html?: string;
  tags?: string;
  template_suffix?: string;
}

export interface ShopifyMetafield {
  key: string;
  namespace: string;
  value: string;
  type: string;
}

export interface ShopifyPage {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  author: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  template_suffix?: string;
  metafields?: ShopifyMetafield[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags: string;
  status: "active" | "draft" | "archived";
  metafields_global_title_tag?: string;
  metafields_global_description_tag?: string;
}

export interface PublishResult {
  success: boolean;
  articleId?: number;
  url?: string;
  error?: string;
}

// ============================================
// SHOPIFY CLIENT
// ============================================

export class ShopifyClient {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config: ShopifyConfig) {
    // Normalize domain
    let domain = config.shopDomain.replace(/https?:\/\//, "").replace(/\/$/, "");
    if (!domain.includes(".myshopify.com")) {
      domain = `${domain}.myshopify.com`;
    }
    this.shopDomain = domain;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || "2024-01";
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; shopName?: string; error?: string }> {
    try {
      const shop = await this.request<{ shop: { name: string } }>("/admin/api/shop.json");
      return { success: true, shopName: shop.shop.name };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
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
    const url = `https://${this.shopDomain}${endpoint.replace("/admin/api/", `/admin/api/${this.apiVersion}/`)}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error.errors
        ? typeof error.errors === "string"
          ? error.errors
          : JSON.stringify(error.errors)
        : `Shopify API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ============================================
  // BLOGS
  // ============================================

  /**
   * List all blogs
   */
  async listBlogs(): Promise<ShopifyBlog[]> {
    const response = await this.request<{ blogs: ShopifyBlog[] }>(
      "/admin/api/blogs.json"
    );
    return response.blogs || [];
  }

  /**
   * Get a blog by ID
   */
  async getBlog(blogId: number): Promise<ShopifyBlog> {
    const response = await this.request<{ blog: ShopifyBlog }>(
      `/admin/api/blogs/${blogId}.json`
    );
    return response.blog;
  }

  /**
   * Find main blog (usually "News" or first blog)
   */
  async findMainBlog(): Promise<ShopifyBlog | null> {
    const blogs = await this.listBlogs();
    
    // Look for common blog names
    const mainBlogNames = ["news", "blog", "articles", "journal"];
    
    for (const name of mainBlogNames) {
      const blog = blogs.find(
        b => b.handle.toLowerCase() === name || 
             b.title.toLowerCase().includes(name)
      );
      if (blog) return blog;
    }

    return blogs[0] || null;
  }

  // ============================================
  // ARTICLES (Blog Posts)
  // ============================================

  /**
   * List articles in a blog
   */
  async listArticles(
    blogId: number,
    options: {
      limit?: number;
      sinceId?: number;
      createdAtMin?: string;
      publishedStatus?: "published" | "unpublished" | "any";
    } = {}
  ): Promise<ShopifyArticle[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.sinceId) params.set("since_id", String(options.sinceId));
    if (options.createdAtMin) params.set("created_at_min", options.createdAtMin);
    if (options.publishedStatus) params.set("published_status", options.publishedStatus);

    const response = await this.request<{ articles: ShopifyArticle[] }>(
      `/admin/api/blogs/${blogId}/articles.json?${params.toString()}`
    );
    return response.articles || [];
  }

  /**
   * Get a single article
   */
  async getArticle(blogId: number, articleId: number): Promise<ShopifyArticle> {
    const response = await this.request<{ article: ShopifyArticle }>(
      `/admin/api/blogs/${blogId}/articles/${articleId}.json`
    );
    return response.article;
  }

  /**
   * Create a new article
   */
  async createArticle(
    blogId: number,
    article: Omit<ShopifyArticle, "id" | "created_at" | "updated_at" | "blog_id">
  ): Promise<PublishResult> {
    try {
      const response = await this.request<{ article: ShopifyArticle }>(
        `/admin/api/blogs/${blogId}/articles.json`,
        {
          method: "POST",
          body: JSON.stringify({
            article: {
              ...article,
              blog_id: blogId,
            },
          }),
        }
      );

      const createdArticle = response.article;
      const shopUrl = `https://${this.shopDomain.replace(".myshopify.com", "")}`;
      const blog = await this.getBlog(blogId);

      return {
        success: true,
        articleId: createdArticle.id,
        url: `${shopUrl}/blogs/${blog.handle}/${createdArticle.handle}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create article",
      };
    }
  }

  /**
   * Update an article
   */
  async updateArticle(
    blogId: number,
    articleId: number,
    article: Partial<ShopifyArticle>
  ): Promise<PublishResult> {
    try {
      const response = await this.request<{ article: ShopifyArticle }>(
        `/admin/api/blogs/${blogId}/articles/${articleId}.json`,
        {
          method: "PUT",
          body: JSON.stringify({ article }),
        }
      );

      const updatedArticle = response.article;
      const shopUrl = `https://${this.shopDomain.replace(".myshopify.com", "")}`;
      const blog = await this.getBlog(blogId);

      return {
        success: true,
        articleId: updatedArticle.id,
        url: `${shopUrl}/blogs/${blog.handle}/${updatedArticle.handle}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update article",
      };
    }
  }

  /**
   * Delete an article
   */
  async deleteArticle(blogId: number, articleId: number): Promise<boolean> {
    try {
      await this.request(`/admin/api/blogs/${blogId}/articles/${articleId}.json`, {
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
    limit?: number;
    publishedStatus?: "published" | "unpublished" | "any";
  } = {}): Promise<ShopifyPage[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.publishedStatus) params.set("published_status", options.publishedStatus);

    const response = await this.request<{ pages: ShopifyPage[] }>(
      `/admin/api/pages.json?${params.toString()}`
    );
    return response.pages || [];
  }

  /**
   * Update page content
   */
  async updatePage(
    pageId: number,
    data: Partial<ShopifyPage>
  ): Promise<boolean> {
    try {
      await this.request(`/admin/api/pages/${pageId}.json`, {
        method: "PUT",
        body: JSON.stringify({ page: data }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // PRODUCTS (SEO)
  // ============================================

  /**
   * List products
   */
  async listProducts(options: {
    limit?: number;
    status?: "active" | "draft" | "archived";
  } = {}): Promise<ShopifyProduct[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", options.status);

    const response = await this.request<{ products: ShopifyProduct[] }>(
      `/admin/api/products.json?${params.toString()}`
    );
    return response.products || [];
  }

  /**
   * Update product SEO
   */
  async updateProductSEO(
    productId: number,
    seo: {
      title?: string;
      description?: string;
      handle?: string;
    }
  ): Promise<boolean> {
    try {
      await this.request(`/admin/api/products/${productId}.json`, {
        method: "PUT",
        body: JSON.stringify({
          product: {
            id: productId,
            metafields_global_title_tag: seo.title,
            metafields_global_description_tag: seo.description,
            handle: seo.handle,
          },
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // METAFIELDS (Advanced SEO)
  // ============================================

  /**
   * Set SEO metafields for an article
   */
  async setArticleSEOMetafields(
    blogId: number,
    articleId: number,
    seo: {
      title?: string;
      description?: string;
    }
  ): Promise<boolean> {
    try {
      const metafields: ShopifyMetafield[] = [];

      if (seo.title) {
        metafields.push({
          key: "title_tag",
          namespace: "global",
          value: seo.title,
          type: "single_line_text_field",
        });
      }

      if (seo.description) {
        metafields.push({
          key: "description_tag",
          namespace: "global",
          value: seo.description,
          type: "multi_line_text_field",
        });
      }

      for (const metafield of metafields) {
        await this.request(`/admin/api/blogs/${blogId}/articles/${articleId}/metafields.json`, {
          method: "POST",
          body: JSON.stringify({ metafield }),
        });
      }

      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // HIGH-LEVEL PUBLISHING
  // ============================================

  /**
   * Publish blog post with full SEO
   */
  async publishBlogPost(options: {
    title: string;
    content: string;
    summary?: string;
    author?: string;
    tags?: string[];
    imageUrl?: string;
    imageAlt?: string;
    seoTitle?: string;
    seoDescription?: string;
    publishNow?: boolean;
    blogId?: number;
  }): Promise<PublishResult> {
    try {
      // Find blog if not specified
      let blogId = options.blogId;
      if (!blogId) {
        const mainBlog = await this.findMainBlog();
        if (!mainBlog) {
          return {
            success: false,
            error: "No blog found. Please create a blog first in Shopify.",
          };
        }
        blogId = mainBlog.id;
      }

      // Create the article
      const article: Omit<ShopifyArticle, "id" | "created_at" | "updated_at" | "blog_id"> = {
        title: options.title,
        body_html: options.content,
        author: options.author || "CabbageSEO",
        summary_html: options.summary,
        tags: options.tags?.join(", "),
        published_at: options.publishNow ? new Date().toISOString() : null,
      };

      // Add image if provided
      if (options.imageUrl) {
        article.image = {
          src: options.imageUrl,
          alt: options.imageAlt || options.title,
        };
      }

      const result = await this.createArticle(blogId, article);

      // Set SEO metafields if provided
      if (result.success && result.articleId && (options.seoTitle || options.seoDescription)) {
        await this.setArticleSEOMetafields(blogId, result.articleId, {
          title: options.seoTitle,
          description: options.seoDescription,
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish",
      };
    }
  }

  /**
   * Update existing blog post
   */
  async updateBlogPost(
    blogId: number,
    articleId: number,
    options: {
      title?: string;
      content?: string;
      summary?: string;
      tags?: string[];
      seoTitle?: string;
      seoDescription?: string;
    }
  ): Promise<PublishResult> {
    const updateData: Partial<ShopifyArticle> = {};
    
    if (options.title) updateData.title = options.title;
    if (options.content) updateData.body_html = options.content;
    if (options.summary) updateData.summary_html = options.summary;
    if (options.tags) updateData.tags = options.tags.join(", ");

    const result = await this.updateArticle(blogId, articleId, updateData);

    // Update SEO metafields
    if (result.success && (options.seoTitle || options.seoDescription)) {
      await this.setArticleSEOMetafields(blogId, articleId, {
        title: options.seoTitle,
        description: options.seoDescription,
      });
    }

    return result;
  }

  /**
   * List all blog posts
   */
  async listBlogPosts(options: {
    blogId?: number;
    limit?: number;
  } = {}): Promise<{
    posts: Array<{
      id: number;
      title: string;
      handle: string;
      author: string;
      publishedAt?: string;
      tags?: string;
    }>;
    blogId: number;
  }> {
    let blogId = options.blogId;
    if (!blogId) {
      const mainBlog = await this.findMainBlog();
      if (!mainBlog) {
        return { posts: [], blogId: 0 };
      }
      blogId = mainBlog.id;
    }

    const articles = await this.listArticles(blogId, {
      limit: options.limit || 50,
    });

    const posts = articles.map(article => ({
      id: article.id!,
      title: article.title,
      handle: article.handle || "",
      author: article.author,
      publishedAt: article.published_at || undefined,
      tags: article.tags,
    }));

    return { posts, blogId };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createShopifyClient(config: ShopifyConfig): ShopifyClient {
  return new ShopifyClient(config);
}
