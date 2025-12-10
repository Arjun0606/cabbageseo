/**
 * Shopify Storefront & Admin API Client
 * Handles publishing blog posts and product descriptions
 * 
 * API Reference: https://shopify.dev/docs/api/admin-rest
 */

interface ShopifyConfig {
  storeUrl: string;         // e.g., "your-store.myshopify.com"
  accessToken: string;      // Admin API access token
  apiVersion?: string;      // e.g., "2024-01"
}

interface ShopifyBlog {
  id: number;
  handle: string;
  title: string;
  commentable: "no" | "moderate" | "yes";
  feedburner?: string;
  feedburner_location?: string;
  created_at: string;
  updated_at: string;
  template_suffix?: string;
  tags: string;
  admin_graphql_api_id: string;
}

interface ShopifyArticle {
  id: number;
  title: string;
  body_html: string;
  blog_id: number;
  author: string;
  handle: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  summary_html?: string;
  template_suffix?: string;
  tags: string;
  image?: {
    src: string;
    alt?: string;
    width: number;
    height: number;
  };
  metafields?: Array<{
    key: string;
    value: string;
    type: string;
    namespace: string;
  }>;
  admin_graphql_api_id: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: "active" | "archived" | "draft";
  tags: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface CreateArticleData {
  title: string;
  body_html: string;
  author?: string;
  tags?: string;
  summary_html?: string;
  handle?: string;
  published_at?: string | null;  // null = draft
  image?: {
    src: string;
    alt?: string;
  };
  metafields?: Array<{
    key: string;
    value: string;
    type: string;
    namespace: string;
  }>;
}

interface UpdateArticleData extends Partial<CreateArticleData> {
  id: number;
}

export class ShopifyClient {
  private storeUrl: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config?: ShopifyConfig) {
    this.storeUrl = config?.storeUrl || process.env.SHOPIFY_STORE_URL || "";
    this.accessToken = config?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN || "";
    this.apiVersion = config?.apiVersion || "2024-01";
    
    // Normalize store URL
    if (this.storeUrl && !this.storeUrl.includes(".myshopify.com")) {
      this.storeUrl = `${this.storeUrl}.myshopify.com`;
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.storeUrl && this.accessToken);
  }

  /**
   * Get the base URL for API calls
   */
  private get baseUrl(): string {
    return `https://${this.storeUrl}/admin/api/${this.apiVersion}`;
  }

  /**
   * Make authenticated request to Shopify Admin API
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error("Shopify not configured. Set store URL and access token.");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ===============================
  // Blog & Article Methods
  // ===============================

  /**
   * List all blogs
   */
  async listBlogs(): Promise<ShopifyBlog[]> {
    const response = await this.request<{ blogs: ShopifyBlog[] }>("/blogs.json");
    return response.blogs;
  }

  /**
   * Get a specific blog
   */
  async getBlog(blogId: number): Promise<ShopifyBlog> {
    const response = await this.request<{ blog: ShopifyBlog }>(`/blogs/${blogId}.json`);
    return response.blog;
  }

  /**
   * Create a new blog
   */
  async createBlog(title: string, commentable: "no" | "moderate" | "yes" = "no"): Promise<ShopifyBlog> {
    const response = await this.request<{ blog: ShopifyBlog }>(
      "/blogs.json",
      "POST",
      { blog: { title, commentable } }
    );
    return response.blog;
  }

  /**
   * List articles in a blog
   */
  async listArticles(
    blogId: number,
    options: {
      limit?: number;
      since_id?: number;
      created_at_min?: string;
      created_at_max?: string;
      updated_at_min?: string;
      updated_at_max?: string;
      published_status?: "published" | "unpublished" | "any";
      handle?: string;
    } = {}
  ): Promise<ShopifyArticle[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.since_id) params.set("since_id", String(options.since_id));
    if (options.published_status) params.set("published_status", options.published_status);
    
    const response = await this.request<{ articles: ShopifyArticle[] }>(
      `/blogs/${blogId}/articles.json?${params.toString()}`
    );
    return response.articles;
  }

  /**
   * Get a specific article
   */
  async getArticle(blogId: number, articleId: number): Promise<ShopifyArticle> {
    const response = await this.request<{ article: ShopifyArticle }>(
      `/blogs/${blogId}/articles/${articleId}.json`
    );
    return response.article;
  }

  /**
   * Create a new article
   */
  async createArticle(blogId: number, data: CreateArticleData): Promise<ShopifyArticle> {
    const response = await this.request<{ article: ShopifyArticle }>(
      `/blogs/${blogId}/articles.json`,
      "POST",
      { article: data }
    );
    return response.article;
  }

  /**
   * Update an article
   */
  async updateArticle(blogId: number, data: UpdateArticleData): Promise<ShopifyArticle> {
    const response = await this.request<{ article: ShopifyArticle }>(
      `/blogs/${blogId}/articles/${data.id}.json`,
      "PUT",
      { article: data }
    );
    return response.article;
  }

  /**
   * Delete an article
   */
  async deleteArticle(blogId: number, articleId: number): Promise<void> {
    await this.request(`/blogs/${blogId}/articles/${articleId}.json`, "DELETE");
  }

  // ===============================
  // Product Methods
  // ===============================

  /**
   * List products
   */
  async listProducts(
    options: {
      limit?: number;
      since_id?: number;
      status?: "active" | "archived" | "draft";
      product_type?: string;
      vendor?: string;
    } = {}
  ): Promise<ShopifyProduct[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.status) params.set("status", options.status);
    
    const response = await this.request<{ products: ShopifyProduct[] }>(
      `/products.json?${params.toString()}`
    );
    return response.products;
  }

  /**
   * Get a specific product
   */
  async getProduct(productId: number): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      `/products/${productId}.json`
    );
    return response.product;
  }

  /**
   * Update product description
   */
  async updateProductDescription(
    productId: number,
    bodyHtml: string,
    title?: string
  ): Promise<ShopifyProduct> {
    const data: Record<string, unknown> = { body_html: bodyHtml };
    if (title) data.title = title;
    
    const response = await this.request<{ product: ShopifyProduct }>(
      `/products/${productId}.json`,
      "PUT",
      { product: data }
    );
    return response.product;
  }

  // ===============================
  // CabbageSEO Convenience Methods
  // ===============================

  /**
   * Find the default blog or create one
   */
  async getOrCreateDefaultBlog(): Promise<ShopifyBlog> {
    const blogs = await this.listBlogs();
    
    // Return existing blog if found
    if (blogs.length > 0) {
      // Prefer "News" or "Blog" named blogs
      const defaultBlog = blogs.find(b => 
        b.title.toLowerCase() === "news" ||
        b.title.toLowerCase() === "blog"
      ) || blogs[0];
      return defaultBlog;
    }
    
    // Create a new blog
    return this.createBlog("Blog", "no");
  }

  /**
   * Create a blog post with SEO metadata
   */
  async createBlogPost(
    post: {
      title: string;
      content: string;           // HTML content
      excerpt?: string;
      author?: string;
      tags?: string[];
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      publishImmediately?: boolean;
    },
    blogId?: number
  ): Promise<ShopifyArticle> {
    // Get or find blog
    let targetBlogId = blogId;
    if (!targetBlogId) {
      const blog = await this.getOrCreateDefaultBlog();
      targetBlogId = blog.id;
    }

    const articleData: CreateArticleData = {
      title: post.title,
      body_html: post.content,
      author: post.author || "CabbageSEO",
      tags: post.tags?.join(", "),
      summary_html: post.excerpt,
      published_at: post.publishImmediately ? new Date().toISOString() : null,
      handle: this.generateHandle(post.title),
    };

    // Add featured image if provided
    if (post.featuredImage) {
      articleData.image = {
        src: post.featuredImage,
        alt: post.title,
      };
    }

    // Add SEO metafields if provided
    if (post.metaTitle || post.metaDescription) {
      articleData.metafields = [];
      
      if (post.metaTitle) {
        articleData.metafields.push({
          key: "title_tag",
          value: post.metaTitle,
          type: "single_line_text_field",
          namespace: "global",
        });
      }
      
      if (post.metaDescription) {
        articleData.metafields.push({
          key: "description_tag",
          value: post.metaDescription,
          type: "single_line_text_field",
          namespace: "global",
        });
      }
    }

    return this.createArticle(targetBlogId, articleData);
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(
    blogId: number,
    articleId: number,
    post: {
      title?: string;
      content?: string;
      excerpt?: string;
      tags?: string[];
      publish?: boolean;
    }
  ): Promise<ShopifyArticle> {
    const updateData: UpdateArticleData = { id: articleId };
    
    if (post.title) updateData.title = post.title;
    if (post.content) updateData.body_html = post.content;
    if (post.excerpt) updateData.summary_html = post.excerpt;
    if (post.tags) updateData.tags = post.tags.join(", ");
    if (post.publish) updateData.published_at = new Date().toISOString();
    
    return this.updateArticle(blogId, updateData);
  }

  /**
   * Publish a draft article
   */
  async publishArticle(blogId: number, articleId: number): Promise<ShopifyArticle> {
    return this.updateArticle(blogId, {
      id: articleId,
      published_at: new Date().toISOString(),
    });
  }

  /**
   * Generate URL handle from title
   */
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; shop?: { name: string }; error?: string }> {
    try {
      const response = await this.request<{ shop: { name: string } }>("/shop.json");
      return { success: true, shop: response.shop };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}

// Export singleton instance
export const shopify = new ShopifyClient();

