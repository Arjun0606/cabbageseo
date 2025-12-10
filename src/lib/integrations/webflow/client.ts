/**
 * Webflow CMS API Client
 * Handles publishing content to Webflow CMS collections
 * 
 * API Reference: https://developers.webflow.com/reference
 */

interface WebflowConfig {
  apiKey?: string;
  siteId?: string;
}

interface WebflowSite {
  id: string;
  workspaceId: string;
  displayName: string;
  shortName: string;
  previewUrl: string;
  timeZone: string;
  createdOn: string;
  lastUpdated: string;
  lastPublished?: string;
}

interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  createdOn: string;
  lastUpdated: string;
  fields: WebflowField[];
}

interface WebflowField {
  id: string;
  isEditable: boolean;
  isRequired: boolean;
  type: string;
  slug: string;
  displayName: string;
  helpText?: string;
  validations?: Record<string, unknown>;
}

interface WebflowItem {
  id: string;
  cmsLocaleId?: string;
  lastPublished?: string;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, unknown>;
}

interface CreateItemData {
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: {
    name: string;           // Required: item name
    slug: string;           // Required: URL slug
    [key: string]: unknown; // Dynamic fields based on collection schema
  };
}

interface PublishItemsRequest {
  itemIds: string[];
}

export class WebflowClient {
  private apiKey: string;
  private baseUrl = "https://api.webflow.com/v2";
  private siteId?: string;

  constructor(config?: WebflowConfig) {
    this.apiKey = config?.apiKey || process.env.WEBFLOW_API_KEY || "";
    this.siteId = config?.siteId;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Make authenticated request to Webflow API
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Webflow API key not configured");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webflow API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * List all sites accessible with the API key
   */
  async listSites(): Promise<WebflowSite[]> {
    const response = await this.request<{ sites: WebflowSite[] }>("/sites");
    return response.sites;
  }

  /**
   * Get a specific site by ID
   */
  async getSite(siteId: string): Promise<WebflowSite> {
    return this.request<WebflowSite>(`/sites/${siteId}`);
  }

  /**
   * List all collections for a site
   */
  async listCollections(siteId?: string): Promise<WebflowCollection[]> {
    const id = siteId || this.siteId;
    if (!id) {
      throw new Error("Site ID required");
    }
    const response = await this.request<{ collections: WebflowCollection[] }>(
      `/sites/${id}/collections`
    );
    return response.collections;
  }

  /**
   * Get a specific collection with its fields
   */
  async getCollection(collectionId: string): Promise<WebflowCollection> {
    return this.request<WebflowCollection>(`/collections/${collectionId}`);
  }

  /**
   * List items in a collection
   */
  async listItems(
    collectionId: string,
    options: {
      offset?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: WebflowItem[]; pagination: { total: number; offset: number; limit: number } }> {
    const params = new URLSearchParams();
    if (options.offset) params.set("offset", String(options.offset));
    if (options.limit) params.set("limit", String(options.limit || 100));
    
    return this.request<{
      items: WebflowItem[];
      pagination: { total: number; offset: number; limit: number };
    }>(`/collections/${collectionId}/items?${params.toString()}`);
  }

  /**
   * Get a specific item
   */
  async getItem(collectionId: string, itemId: string): Promise<WebflowItem> {
    return this.request<WebflowItem>(`/collections/${collectionId}/items/${itemId}`);
  }

  /**
   * Create a new item in a collection
   */
  async createItem(collectionId: string, data: CreateItemData): Promise<WebflowItem> {
    return this.request<WebflowItem>(
      `/collections/${collectionId}/items`,
      "POST",
      data
    );
  }

  /**
   * Update an existing item
   */
  async updateItem(
    collectionId: string,
    itemId: string,
    data: Partial<CreateItemData>
  ): Promise<WebflowItem> {
    return this.request<WebflowItem>(
      `/collections/${collectionId}/items/${itemId}`,
      "PATCH",
      data
    );
  }

  /**
   * Delete an item
   */
  async deleteItem(collectionId: string, itemId: string): Promise<void> {
    await this.request<void>(
      `/collections/${collectionId}/items/${itemId}`,
      "DELETE"
    );
  }

  /**
   * Publish items (make them live)
   */
  async publishItems(collectionId: string, itemIds: string[]): Promise<void> {
    await this.request<void>(
      `/collections/${collectionId}/items/publish`,
      "POST",
      { itemIds } as PublishItemsRequest
    );
  }

  /**
   * Publish the entire site
   */
  async publishSite(siteId?: string, domains?: string[]): Promise<void> {
    const id = siteId || this.siteId;
    if (!id) {
      throw new Error("Site ID required");
    }

    await this.request<void>(
      `/sites/${id}/publish`,
      "POST",
      domains ? { publishToWebflowSubdomain: true, customDomains: domains } : undefined
    );
  }

  // ===============================
  // CabbageSEO Convenience Methods
  // ===============================

  /**
   * Find a blog/posts collection in the site
   * Looks for common collection names
   */
  async findBlogCollection(siteId?: string): Promise<WebflowCollection | null> {
    const collections = await this.listCollections(siteId);
    
    // Common blog collection names
    const blogNames = ["blog", "posts", "articles", "news", "blog-posts", "blog posts"];
    
    for (const collection of collections) {
      const lowerName = collection.displayName.toLowerCase();
      const lowerSlug = collection.slug.toLowerCase();
      
      if (blogNames.some(name => lowerName.includes(name) || lowerSlug.includes(name))) {
        return collection;
      }
    }
    
    return null;
  }

  /**
   * Create a blog post in Webflow
   * Automatically maps common field names
   */
  async createBlogPost(
    collectionId: string,
    post: {
      title: string;
      slug: string;
      content: string;           // Rich text / HTML
      excerpt?: string;
      author?: string;
      category?: string;
      tags?: string[];
      featuredImage?: string;    // URL to image
      metaTitle?: string;
      metaDescription?: string;
      publishDate?: Date;
      isDraft?: boolean;
    }
  ): Promise<WebflowItem> {
    // Get collection schema to map fields correctly
    const collection = await this.getCollection(collectionId);
    const fieldMap = this.mapFieldsToSchema(collection.fields, post);

    return this.createItem(collectionId, {
      isArchived: false,
      isDraft: post.isDraft ?? true,
      fieldData: {
        name: post.title,
        slug: this.generateSlug(post.slug || post.title),
        ...fieldMap,
      },
    });
  }

  /**
   * Update a blog post
   */
  async updateBlogPost(
    collectionId: string,
    itemId: string,
    post: {
      title?: string;
      content?: string;
      excerpt?: string;
      metaTitle?: string;
      metaDescription?: string;
      isDraft?: boolean;
    }
  ): Promise<WebflowItem> {
    const collection = await this.getCollection(collectionId);
    const fieldMap = this.mapFieldsToSchema(collection.fields, post);

    const fieldData: Record<string, unknown> = { ...fieldMap };
    
    if (post.title) {
      fieldData.name = post.title;
    }

    const updateData: Partial<CreateItemData> = {};
    
    if (Object.keys(fieldData).length > 0) {
      updateData.fieldData = fieldData as CreateItemData["fieldData"];
    }

    if (post.isDraft !== undefined) {
      updateData.isDraft = post.isDraft;
    }

    return this.updateItem(collectionId, itemId, updateData);
  }

  /**
   * Publish a blog post (take it live)
   */
  async publishBlogPost(collectionId: string, itemId: string): Promise<void> {
    // First, update the item to not be a draft
    await this.updateItem(collectionId, itemId, { isDraft: false });
    
    // Then publish it
    await this.publishItems(collectionId, [itemId]);
  }

  /**
   * Map CabbageSEO post data to Webflow collection fields
   */
  private mapFieldsToSchema(
    fields: WebflowField[],
    post: Record<string, unknown>
  ): Record<string, unknown> {
    const fieldData: Record<string, unknown> = {};
    
    // Common field name mappings
    const mappings: Record<string, string[]> = {
      content: ["content", "body", "post-body", "post-content", "rich-text", "article-body"],
      excerpt: ["excerpt", "summary", "description", "intro", "post-excerpt"],
      author: ["author", "author-name", "writer"],
      category: ["category", "categories", "post-category"],
      tags: ["tags", "post-tags"],
      featuredImage: ["featured-image", "main-image", "thumbnail", "hero-image", "image", "cover"],
      metaTitle: ["meta-title", "seo-title", "page-title"],
      metaDescription: ["meta-description", "seo-description"],
      publishDate: ["publish-date", "date", "post-date", "published-on"],
    };

    for (const [postField, webflowFieldNames] of Object.entries(mappings)) {
      if (post[postField] === undefined) continue;
      
      // Find matching field in collection
      const matchingField = fields.find(f => 
        webflowFieldNames.some(name => 
          f.slug.toLowerCase() === name ||
          f.displayName.toLowerCase().replace(/\s+/g, "-") === name
        )
      );
      
      if (matchingField) {
        fieldData[matchingField.slug] = post[postField];
      }
    }

    return fieldData;
  }

  /**
   * Generate a URL-safe slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; sites?: WebflowSite[]; error?: string }> {
    try {
      const sites = await this.listSites();
      return { success: true, sites };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}

// Export singleton instance
export const webflow = new WebflowClient();
