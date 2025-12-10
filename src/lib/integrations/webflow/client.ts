/**
 * Webflow CMS API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating/updating CMS items (blog posts)
 * - Managing collections
 * - Publishing to live site
 * - Managing site domains
 * - SEO meta fields
 */

// ============================================
// TYPES
// ============================================

export interface WebflowConfig {
  accessToken: string;  // OAuth access token or API token
}

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl: string;
  timeZone: string;
  createdOn: string;
  lastUpdated: string;
  lastPublished?: string;
  customDomains: WebflowDomain[];
}

export interface WebflowDomain {
  id: string;
  url: string;
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  createdOn: string;
  lastUpdated: string;
  fields: WebflowField[];
}

export interface WebflowField {
  id: string;
  isEditable: boolean;
  isRequired: boolean;
  type: string;
  slug: string;
  displayName: string;
  helpText?: string;
  validations?: {
    maxLength?: number;
    minLength?: number;
    pattern?: string;
  };
}

export interface WebflowItem {
  id?: string;
  cmsLocaleId?: string;
  lastPublished?: string;
  lastUpdated?: string;
  createdOn?: string;
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: {
    name: string;
    slug: string;
    [key: string]: unknown;
  };
}

export interface WebflowItemCreate {
  isArchived?: boolean;
  isDraft?: boolean;
  fieldData: {
    name: string;
    slug: string;
    // SEO fields (if available in collection)
    "seo-title"?: string;
    "meta-description"?: string;
    "open-graph-image"?: string;
    // Content fields
    "post-body"?: string;
    "post-summary"?: string;
    "thumbnail-image"?: string;
    "author"?: string;
    "category"?: string;
    "publish-date"?: string;
    [key: string]: unknown;
  };
}

export interface PublishResult {
  success: boolean;
  itemId?: string;
  url?: string;
  error?: string;
}

// ============================================
// WEBFLOW CLIENT
// ============================================

export class WebflowClient {
  private accessToken: string;
  private baseUrl = "https://api.webflow.com/v2";

  constructor(config: WebflowConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request<{ sites: WebflowSite[] }>("/sites");
      return { success: true };
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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "accept-version": "2.0.0",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || error.err || `Webflow API error: ${response.status}`
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    return JSON.parse(text);
  }

  // ============================================
  // SITES
  // ============================================

  /**
   * List all sites
   */
  async listSites(): Promise<WebflowSite[]> {
    const response = await this.request<{ sites: WebflowSite[] }>("/sites");
    return response.sites || [];
  }

  /**
   * Get site by ID
   */
  async getSite(siteId: string): Promise<WebflowSite> {
    return this.request<WebflowSite>(`/sites/${siteId}`);
  }

  /**
   * Publish site (make changes live)
   */
  async publishSite(siteId: string, domains?: string[]): Promise<boolean> {
    try {
      await this.request(`/sites/${siteId}/publish`, {
        method: "POST",
        body: JSON.stringify({
          publishToWebflowSubdomain: true,
          customDomains: domains,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get site domains
   */
  async getSiteDomains(siteId: string): Promise<WebflowDomain[]> {
    const response = await this.request<{ customDomains: WebflowDomain[] }>(
      `/sites/${siteId}/custom_domains`
    );
    return response.customDomains || [];
  }

  // ============================================
  // COLLECTIONS
  // ============================================

  /**
   * List collections for a site
   */
  async listCollections(siteId: string): Promise<WebflowCollection[]> {
    const response = await this.request<{ collections: WebflowCollection[] }>(
      `/sites/${siteId}/collections`
    );
    return response.collections || [];
  }

  /**
   * Get collection details with fields
   */
  async getCollection(collectionId: string): Promise<WebflowCollection> {
    return this.request<WebflowCollection>(`/collections/${collectionId}`);
  }

  /**
   * Find blog/posts collection
   */
  async findBlogCollection(siteId: string): Promise<WebflowCollection | null> {
    const collections = await this.listCollections(siteId);
    
    // Look for common blog collection names
    const blogNames = ["blog", "posts", "articles", "news", "blog posts"];
    
    for (const name of blogNames) {
      const collection = collections.find(
        c => c.displayName.toLowerCase().includes(name) || 
             c.slug.toLowerCase().includes(name)
      );
      if (collection) return collection;
    }

    // Return first collection as fallback
    return collections[0] || null;
  }

  // ============================================
  // COLLECTION ITEMS (CMS Items)
  // ============================================

  /**
   * List items in a collection
   */
  async listItems(
    collectionId: string,
    options: {
      offset?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: WebflowItem[]; pagination: { total: number } }> {
    const params = new URLSearchParams();
    if (options.offset) params.set("offset", String(options.offset));
    if (options.limit) params.set("limit", String(options.limit || 100));

    return this.request(`/collections/${collectionId}/items?${params.toString()}`);
  }

  /**
   * Get a single item
   */
  async getItem(collectionId: string, itemId: string): Promise<WebflowItem> {
    return this.request(`/collections/${collectionId}/items/${itemId}`);
  }

  /**
   * Create a new item (blog post)
   */
  async createItem(
    collectionId: string,
    item: WebflowItemCreate,
    live: boolean = false
  ): Promise<PublishResult> {
    try {
      const endpoint = live 
        ? `/collections/${collectionId}/items/live`
        : `/collections/${collectionId}/items`;

      const result = await this.request<WebflowItem>(endpoint, {
        method: "POST",
        body: JSON.stringify(item),
      });

      return {
        success: true,
        itemId: result.id,
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
    item: Partial<WebflowItemCreate>,
    live: boolean = false
  ): Promise<PublishResult> {
    try {
      const endpoint = live
        ? `/collections/${collectionId}/items/${itemId}/live`
        : `/collections/${collectionId}/items/${itemId}`;

      const result = await this.request<WebflowItem>(endpoint, {
        method: "PATCH",
        body: JSON.stringify(item),
      });

      return {
        success: true,
        itemId: result.id,
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
      await this.request(`/collections/${collectionId}/items/${itemId}`, {
        method: "DELETE",
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Publish items (make staging changes live)
   */
  async publishItems(collectionId: string, itemIds: string[]): Promise<boolean> {
    try {
      await this.request(`/collections/${collectionId}/items/publish`, {
        method: "POST",
        body: JSON.stringify({ itemIds }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // HIGH-LEVEL PUBLISHING
  // ============================================

  /**
   * Map collection fields to our standard content format
   */
  private mapFieldsForCollection(
    collection: WebflowCollection,
    content: {
      title: string;
      slug: string;
      body: string;
      summary?: string;
      seoTitle?: string;
      metaDescription?: string;
      author?: string;
      category?: string;
      publishDate?: string;
      thumbnailUrl?: string;
    }
  ): WebflowItemCreate["fieldData"] {
    const fieldData: WebflowItemCreate["fieldData"] = {
      name: content.title,
      slug: content.slug,
    };

    // Map fields based on what's available in the collection
    const fieldMap: Record<string, string[]> = {
      // Body/content field variants
      body: ["post-body", "body", "content", "article-body", "main-content", "rich-text"],
      // Summary/excerpt variants
      summary: ["post-summary", "summary", "excerpt", "description", "intro"],
      // SEO title variants
      seoTitle: ["seo-title", "meta-title", "page-title"],
      // Meta description variants
      metaDescription: ["meta-description", "seo-description", "meta-desc"],
      // Author variants
      author: ["author", "author-name", "written-by"],
      // Category variants
      category: ["category", "categories", "topic"],
      // Date variants
      publishDate: ["publish-date", "date", "published-on", "post-date"],
      // Image variants
      thumbnail: ["thumbnail-image", "featured-image", "hero-image", "image", "cover"],
    };

    const collectionFieldSlugs = collection.fields.map(f => f.slug);

    // Find matching fields
    for (const [contentKey, possibleSlugs] of Object.entries(fieldMap)) {
      const matchingSlug = possibleSlugs.find(slug => 
        collectionFieldSlugs.includes(slug)
      );

      if (matchingSlug) {
        const value = content[contentKey as keyof typeof content];
        if (value) {
          fieldData[matchingSlug] = value;
        }
      }
    }

    return fieldData;
  }

  /**
   * Publish blog post with full SEO setup
   */
  async publishBlogPost(
    siteId: string,
    content: {
      title: string;
      slug: string;
      body: string;
      summary?: string;
      seoTitle?: string;
      metaDescription?: string;
      author?: string;
      category?: string;
      publishDate?: string;
      thumbnailUrl?: string;
    },
    options: {
      collectionId?: string;  // If known, use directly
      publishLive?: boolean;  // Publish directly to live site
      isDraft?: boolean;      // Save as draft
    } = {}
  ): Promise<PublishResult> {
    try {
      // Find the blog collection
      let collectionId = options.collectionId;
      let collection: WebflowCollection;

      if (!collectionId) {
        const blogCollection = await this.findBlogCollection(siteId);
        if (!blogCollection) {
          return {
            success: false,
            error: "No blog collection found. Please specify collectionId.",
          };
        }
        collectionId = blogCollection.id;
        collection = blogCollection;
      } else {
        collection = await this.getCollection(collectionId);
      }

      // Map content to collection fields
      const fieldData = this.mapFieldsForCollection(collection, content);

      // Create the item
      const item: WebflowItemCreate = {
        isDraft: options.isDraft ?? false,
        isArchived: false,
        fieldData,
      };

      const result = await this.createItem(
        collectionId,
        item,
        options.publishLive ?? false
      );

      if (result.success && result.itemId) {
        // Get site URL for the published post
        const site = await this.getSite(siteId);
        const baseUrl = site.customDomains?.[0]?.url || site.previewUrl;
        result.url = `${baseUrl}/${collection.slug}/${content.slug}`;
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
    collectionId: string,
    itemId: string,
    content: {
      title?: string;
      body?: string;
      summary?: string;
      seoTitle?: string;
      metaDescription?: string;
    },
    options: {
      publishLive?: boolean;
    } = {}
  ): Promise<PublishResult> {
    try {
      const collection = await this.getCollection(collectionId);
      const existingItem = await this.getItem(collectionId, itemId);

      // Build update data
      const fieldData: Partial<WebflowItemCreate["fieldData"]> = {
        ...existingItem.fieldData,
      };

      // Update fields that are provided
      if (content.title) fieldData.name = content.title;

      // Map other fields
      const fieldMap: Record<string, string[]> = {
        body: ["post-body", "body", "content"],
        summary: ["post-summary", "summary", "excerpt"],
        seoTitle: ["seo-title", "meta-title"],
        metaDescription: ["meta-description", "seo-description"],
      };

      const collectionFieldSlugs = collection.fields.map(f => f.slug);

      for (const [contentKey, possibleSlugs] of Object.entries(fieldMap)) {
        const value = content[contentKey as keyof typeof content];
        if (value) {
          const matchingSlug = possibleSlugs.find(slug =>
            collectionFieldSlugs.includes(slug)
          );
          if (matchingSlug) {
            fieldData[matchingSlug] = value;
          }
        }
      }

      return this.updateItem(
        collectionId,
        itemId,
        { fieldData: fieldData as WebflowItemCreate["fieldData"] },
        options.publishLive ?? false
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update",
      };
    }
  }

  /**
   * List all blog posts
   */
  async listBlogPosts(
    siteId: string,
    options: {
      collectionId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    posts: Array<{
      id: string;
      title: string;
      slug: string;
      isDraft: boolean;
      lastUpdated?: string;
    }>;
    total: number;
  }> {
    let collectionId = options.collectionId;

    if (!collectionId) {
      const blogCollection = await this.findBlogCollection(siteId);
      if (!blogCollection) {
        return { posts: [], total: 0 };
      }
      collectionId = blogCollection.id;
    }

    const { items, pagination } = await this.listItems(collectionId, {
      limit: options.limit,
      offset: options.offset,
    });

    const posts = items.map(item => ({
      id: item.id || "",
      title: item.fieldData.name,
      slug: item.fieldData.slug,
      isDraft: item.isDraft ?? false,
      lastUpdated: item.lastUpdated,
    }));

    return { posts, total: pagination.total };
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Publish multiple items at once
   */
  async bulkPublish(
    siteId: string,
    collectionId: string,
    itemIds: string[]
  ): Promise<{
    success: boolean;
    publishedCount: number;
    error?: string;
  }> {
    try {
      await this.publishItems(collectionId, itemIds);
      
      // Also publish the site to make changes live
      await this.publishSite(siteId);

      return {
        success: true,
        publishedCount: itemIds.length,
      };
    } catch (error) {
      return {
        success: false,
        publishedCount: 0,
        error: error instanceof Error ? error.message : "Bulk publish failed",
      };
    }
  }

  /**
   * Archive multiple items
   */
  async bulkArchive(
    collectionId: string,
    itemIds: string[]
  ): Promise<{ success: boolean; archivedCount: number }> {
    let archivedCount = 0;

    for (const itemId of itemIds) {
      try {
        await this.updateItem(collectionId, itemId, { isArchived: true });
        archivedCount++;
      } catch {
        // Continue with other items
      }
    }

    return {
      success: archivedCount === itemIds.length,
      archivedCount,
    };
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createWebflowClient(config: WebflowConfig): WebflowClient {
  return new WebflowClient(config);
}
