/**
 * Framer CMS API Client for CabbageSEO
 * 
 * Framer uses a REST API for CMS collections.
 * This client supports:
 * - Creating/updating CMS items
 * - Managing collections
 * - Publishing content
 */

// ============================================
// TYPES
// ============================================

export interface FramerConfig {
  projectId: string;        // Framer project ID
  accessToken: string;      // API access token
  collectionId?: string;    // Default collection to publish to
}

export interface FramerItem {
  id?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  status?: "draft" | "published";
  fields: Record<string, unknown>;
}

export interface FramerCollection {
  id: string;
  name: string;
  slug: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface PublishResult {
  success: boolean;
  itemId?: string;
  url?: string;
  error?: string;
}

// ============================================
// FRAMER CLIENT
// ============================================

export class FramerClient {
  private projectId: string;
  private accessToken: string;
  private collectionId?: string;
  private baseUrl = "https://api.framer.com/v1";

  constructor(config: FramerConfig) {
    this.projectId = config.projectId;
    this.accessToken = config.accessToken;
    this.collectionId = config.collectionId;
  }

  /**
   * Make authenticated request to Framer API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Framer-Project-ID": this.projectId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Framer API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test connection to Framer
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request(`/projects/${this.projectId}`);
      return true;
    } catch (error) {
      console.error("Framer connection test failed:", error);
      return false;
    }
  }

  /**
   * Get project info
   */
  async getProject(): Promise<{ id: string; name: string; url: string }> {
    return this.request(`/projects/${this.projectId}`);
  }

  // ============================================
  // COLLECTIONS
  // ============================================

  /**
   * List all collections in the project
   */
  async listCollections(): Promise<FramerCollection[]> {
    const response = await this.request<{ collections: FramerCollection[] }>(
      `/projects/${this.projectId}/collections`
    );
    return response.collections || [];
  }

  /**
   * Get a collection by ID
   */
  async getCollection(collectionId: string): Promise<FramerCollection> {
    return this.request(
      `/projects/${this.projectId}/collections/${collectionId}`
    );
  }

  /**
   * Find blog collection (common names: posts, blog, articles)
   */
  async findBlogCollection(): Promise<FramerCollection | null> {
    const collections = await this.listCollections();
    
    const blogNames = ["posts", "blog", "articles", "news", "content"];
    
    for (const name of blogNames) {
      const collection = collections.find(c => 
        c.slug.toLowerCase() === name || 
        c.name.toLowerCase().includes(name)
      );
      if (collection) return collection;
    }

    return collections[0] || null;
  }

  // ============================================
  // ITEMS
  // ============================================

  /**
   * List items in a collection
   */
  async listItems(
    collectionId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: "draft" | "published";
    } = {}
  ): Promise<FramerItem[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));
    if (options.status) params.set("status", options.status);

    const response = await this.request<{ items: FramerItem[] }>(
      `/projects/${this.projectId}/collections/${collectionId}/items?${params.toString()}`
    );
    return response.items || [];
  }

  /**
   * Get a single item
   */
  async getItem(collectionId: string, itemId: string): Promise<FramerItem> {
    return this.request(
      `/projects/${this.projectId}/collections/${collectionId}/items/${itemId}`
    );
  }

  /**
   * Create a new item
   */
  async createItem(
    collectionId: string,
    item: Omit<FramerItem, "id" | "createdAt" | "updatedAt">
  ): Promise<PublishResult> {
    try {
      const response = await this.request<FramerItem>(
        `/projects/${this.projectId}/collections/${collectionId}/items`,
        {
          method: "POST",
          body: JSON.stringify(item),
        }
      );

      const project = await this.getProject();

      return {
        success: true,
        itemId: response.id,
        url: `${project.url}/${item.slug || response.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create item",
      };
    }
  }

  /**
   * Update an existing item
   */
  async updateItem(
    collectionId: string,
    itemId: string,
    item: Partial<FramerItem>
  ): Promise<PublishResult> {
    try {
      const response = await this.request<FramerItem>(
        `/projects/${this.projectId}/collections/${collectionId}/items/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify(item),
        }
      );

      const project = await this.getProject();

      return {
        success: true,
        itemId: response.id,
        url: `${project.url}/${item.slug || response.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update item",
      };
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(collectionId: string, itemId: string): Promise<boolean> {
    try {
      await this.request(
        `/projects/${this.projectId}/collections/${collectionId}/items/${itemId}`,
        { method: "DELETE" }
      );
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
    featuredImage?: string;
    author?: string;
    seoMeta?: {
      title?: string;
      description?: string;
    };
  }): Promise<PublishResult> {
    // Find or use configured collection
    let collectionId = this.collectionId;
    if (!collectionId) {
      const blogCollection = await this.findBlogCollection();
      if (!blogCollection) {
        return {
          success: false,
          error: "No blog collection found. Please create a CMS collection first.",
        };
      }
      collectionId = blogCollection.id;
    }

    // Build item with common Framer CMS field names
    const item: Omit<FramerItem, "id" | "createdAt" | "updatedAt"> = {
      slug: options.slug || options.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      status: options.status || "draft",
      fields: {
        // Common field names in Framer blog templates
        title: options.title,
        name: options.title,
        content: options.content,
        body: options.content,
        excerpt: options.excerpt,
        summary: options.excerpt,
        description: options.excerpt,
        featuredImage: options.featuredImage,
        image: options.featuredImage,
        author: options.author,
        // SEO fields
        seoTitle: options.seoMeta?.title || options.title,
        metaTitle: options.seoMeta?.title || options.title,
        seoDescription: options.seoMeta?.description || options.excerpt,
        metaDescription: options.seoMeta?.description || options.excerpt,
        // Date fields
        publishDate: new Date().toISOString(),
        date: new Date().toISOString(),
      },
    };

    return this.createItem(collectionId, item);
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createFramerClient(config: FramerConfig): FramerClient {
  return new FramerClient(config);
}

