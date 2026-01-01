/**
 * Unified CMS Publisher for CabbageSEO
 * 
 * Orchestrates publishing to:
 * - WordPress
 * - Webflow
 * - Shopify
 * - Ghost
 * - Notion
 * - HubSpot
 * - Framer
 * - Webhooks
 * 
 * Single interface for all CMS operations
 */

import { 
  WordPressClient, 
  createWordPressClient,
  type WordPressConfig,
  type PublishResult as WPPublishResult 
} from "@/lib/integrations/wordpress/client";

import { 
  WebflowClient, 
  createWebflowClient,
  type WebflowConfig 
} from "@/lib/integrations/webflow/client";

import { 
  ShopifyClient, 
  createShopifyClient,
  type ShopifyConfig 
} from "@/lib/integrations/shopify/client";

import {
  GhostClient,
  createGhostClient,
  type GhostConfig,
} from "@/lib/integrations/ghost/client";

import {
  NotionClient,
  createNotionClient,
  type NotionConfig,
} from "@/lib/integrations/notion/client";

import {
  HubSpotClient,
  createHubSpotClient,
  type HubSpotConfig,
} from "@/lib/integrations/hubspot/client";

import {
  FramerClient,
  createFramerClient,
  type FramerConfig,
} from "@/lib/integrations/framer/client";

import {
  WebhookClient,
  createWebhookClient,
  type WebhookConfig,
} from "@/lib/integrations/webhooks/client";

// ============================================
// TYPES
// ============================================

export type CMSType = "wordpress" | "webflow" | "shopify" | "ghost" | "notion" | "hubspot" | "framer" | "webhooks";

export interface CMSConnection {
  type: CMSType;
  wordpress?: WordPressConfig;
  webflow?: WebflowConfig & { siteId: string };
  shopify?: ShopifyConfig & { blogId?: number };
  ghost?: GhostConfig;
  notion?: NotionConfig;
  hubspot?: HubSpotConfig & { blogId?: string };
  framer?: FramerConfig;
  webhooks?: WebhookConfig;
}

export interface PublishContent {
  title: string;
  content: string;           // HTML content
  slug?: string;
  excerpt?: string;
  
  // SEO
  seoTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonical?: string;
  
  // Categorization
  categories?: string[];
  tags?: string[];
  
  // Media
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  
  // Author
  author?: string;
  
  // Scheduling
  publishDate?: string;      // ISO 8601 for scheduling
  status?: "draft" | "publish" | "scheduled";
}

export interface PublishResult {
  success: boolean;
  cms: CMSType;
  postId?: string | number;
  url?: string;
  error?: string;
}

export interface CMSContent {
  id: string | number;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  url?: string;
  publishedAt?: string;
  updatedAt?: string;
}

// ============================================
// CMS PUBLISHER
// ============================================

export class CMSPublisher {
  private wpClient?: WordPressClient;
  private webflowClient?: WebflowClient;
  private shopifyClient?: ShopifyClient;
  private ghostClient?: GhostClient;
  private notionClient?: NotionClient;
  private hubspotClient?: HubSpotClient;
  private framerClient?: FramerClient;
  private webhookClient?: WebhookClient;
  private connection: CMSConnection;

  constructor(connection: CMSConnection) {
    this.connection = connection;
    
    // Initialize appropriate client
    switch (connection.type) {
      case "wordpress":
        if (connection.wordpress) {
          this.wpClient = createWordPressClient(connection.wordpress);
        }
        break;
      case "webflow":
        if (connection.webflow) {
          this.webflowClient = createWebflowClient({
            accessToken: connection.webflow.accessToken,
          });
        }
        break;
      case "shopify":
        if (connection.shopify) {
          this.shopifyClient = createShopifyClient(connection.shopify);
        }
        break;
      case "ghost":
        if (connection.ghost) {
          this.ghostClient = createGhostClient(connection.ghost);
        }
        break;
      case "notion":
        if (connection.notion) {
          this.notionClient = createNotionClient(connection.notion);
        }
        break;
      case "hubspot":
        if (connection.hubspot) {
          this.hubspotClient = createHubSpotClient(connection.hubspot);
        }
        break;
      case "framer":
        if (connection.framer) {
          this.framerClient = createFramerClient(connection.framer);
        }
        break;
      case "webhooks":
        if (connection.webhooks) {
          this.webhookClient = createWebhookClient(connection.webhooks);
        }
        break;
    }
  }

  /**
   * Get the CMS type
   */
  get type(): CMSType {
    return this.connection.type;
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<{ success: boolean; name?: string; error?: string }> {
    try {
      switch (this.connection.type) {
        case "wordpress":
          if (!this.wpClient) throw new Error("WordPress not configured");
          return this.wpClient.testConnection();
          
        case "webflow":
          if (!this.webflowClient) throw new Error("Webflow not configured");
          const wfResult = await this.webflowClient.testConnection();
          if (wfResult.success && this.connection.webflow?.siteId) {
            const site = await this.webflowClient.getSite(this.connection.webflow.siteId);
            return { success: true, name: site.displayName };
          }
          return wfResult;
          
        case "shopify":
          if (!this.shopifyClient) throw new Error("Shopify not configured");
          return this.shopifyClient.testConnection();

        case "ghost":
          if (!this.ghostClient) throw new Error("Ghost not configured");
          const ghostConnected = await this.ghostClient.testConnection();
          if (ghostConnected) {
            const site = await this.ghostClient.getSite();
            return { success: true, name: site.title };
          }
          return { success: false, error: "Ghost connection failed" };

        case "notion":
          if (!this.notionClient) throw new Error("Notion not configured");
          const notionConnected = await this.notionClient.testConnection();
          if (notionConnected) {
            const user = await this.notionClient.getUser();
            return { success: true, name: user.name };
          }
          return { success: false, error: "Notion connection failed" };

        case "hubspot":
          if (!this.hubspotClient) throw new Error("HubSpot not configured");
          const hubspotConnected = await this.hubspotClient.testConnection();
          if (hubspotConnected) {
            const account = await this.hubspotClient.getAccountInfo();
            return { success: true, name: `Portal ${account.portalId}` };
          }
          return { success: false, error: "HubSpot connection failed" };

        case "framer":
          if (!this.framerClient) throw new Error("Framer not configured");
          const framerConnected = await this.framerClient.testConnection();
          if (framerConnected) {
            const project = await this.framerClient.getProject();
            return { success: true, name: project.name };
          }
          return { success: false, error: "Framer connection failed" };

        case "webhooks":
          if (!this.webhookClient) throw new Error("Webhook not configured");
          const webhookConnected = await this.webhookClient.testConnection();
          return { success: webhookConnected, name: "Webhook endpoint" };
          
        default:
          return { success: false, error: "Unknown CMS type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed",
      };
    }
  }

  /**
   * Publish content to the connected CMS
   */
  async publish(content: PublishContent): Promise<PublishResult> {
    try {
      switch (this.connection.type) {
        case "wordpress":
          return this.publishToWordPress(content);
        case "webflow":
          return this.publishToWebflow(content);
        case "shopify":
          return this.publishToShopify(content);
        case "ghost":
          return this.publishToGhost(content);
        case "notion":
          return this.publishToNotion(content);
        case "hubspot":
          return this.publishToHubSpot(content);
        case "framer":
          return this.publishToFramer(content);
        case "webhooks":
          return this.publishToWebhook(content);
        default:
          return {
            success: false,
            cms: this.connection.type,
            error: "Unknown CMS type",
          };
      }
    } catch (error) {
      return {
        success: false,
        cms: this.connection.type,
        error: error instanceof Error ? error.message : "Publish failed",
      };
    }
  }

  /**
   * Update existing content
   */
  async update(postId: string | number, content: Partial<PublishContent>): Promise<PublishResult> {
    try {
      switch (this.connection.type) {
        case "wordpress":
          return this.updateWordPress(Number(postId), content);
        case "webflow":
          return this.updateWebflow(String(postId), content);
        case "shopify":
          return this.updateShopify(Number(postId), content);
        default:
          return {
            success: false,
            cms: this.connection.type,
            error: "Unknown CMS type",
          };
      }
    } catch (error) {
      return {
        success: false,
        cms: this.connection.type,
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  }

  /**
   * List existing content
   */
  async listContent(options: {
    limit?: number;
    status?: "draft" | "published" | "all";
  } = {}): Promise<CMSContent[]> {
    try {
      switch (this.connection.type) {
        case "wordpress":
          return this.listWordPressContent(options);
        case "webflow":
          return this.listWebflowContent(options);
        case "shopify":
          return this.listShopifyContent(options);
        default:
          return [];
      }
    } catch {
      return [];
    }
  }

  /**
   * Delete content
   */
  async delete(postId: string | number): Promise<boolean> {
    try {
      switch (this.connection.type) {
        case "wordpress":
          if (!this.wpClient) return false;
          return this.wpClient.deletePost(Number(postId), true);
        case "webflow":
          if (!this.webflowClient || !this.connection.webflow?.siteId) return false;
          const collection = await this.webflowClient.findBlogCollection(
            this.connection.webflow.siteId
          );
          if (!collection) return false;
          return this.webflowClient.deleteItem(collection.id, String(postId));
        case "shopify":
          if (!this.shopifyClient) return false;
          const { blogId } = await this.shopifyClient.listBlogPosts();
          if (!blogId) return false;
          return this.shopifyClient.deleteArticle(blogId, Number(postId));
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  // ============================================
  // WORDPRESS METHODS
  // ============================================

  private async publishToWordPress(content: PublishContent): Promise<PublishResult> {
    if (!this.wpClient) {
      return { success: false, cms: "wordpress", error: "WordPress not configured" };
    }

    const result = await this.wpClient.publishWithSEO({
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      slug: content.slug,
      status: content.status === "scheduled" ? "future" : (content.status || "draft"),
      scheduledDate: content.publishDate,
      categoryNames: content.categories,
      tagNames: content.tags,
      featuredImageUrl: content.featuredImageUrl,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
        focusKeyword: content.focusKeyword,
        canonical: content.canonical,
      },
      seoPlugin: "yoast",  // Default to Yoast, can be made configurable
    });

    return {
      success: result.success,
      cms: "wordpress",
      postId: result.postId,
      url: result.url,
      error: result.error,
    };
  }

  private async updateWordPress(postId: number, content: Partial<PublishContent>): Promise<PublishResult> {
    if (!this.wpClient) {
      return { success: false, cms: "wordpress", error: "WordPress not configured" };
    }

    const result = await this.wpClient.updateWithSEO(postId, {
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      seoMeta: content.seoTitle || content.metaDescription || content.focusKeyword
        ? {
            title: content.seoTitle,
            description: content.metaDescription,
            focusKeyword: content.focusKeyword,
          }
        : undefined,
      seoPlugin: "yoast",
    });

    return {
      success: result.success,
      cms: "wordpress",
      postId: result.postId,
      url: result.url,
      error: result.error,
    };
  }

  private async listWordPressContent(options: {
    limit?: number;
    status?: "draft" | "published" | "all";
  }): Promise<CMSContent[]> {
    if (!this.wpClient) return [];

    const statusMap = {
      draft: "draft",
      published: "publish",
      all: "any",
    };

    const posts = await this.wpClient.listPosts({
      perPage: options.limit || 50,
      status: statusMap[options.status || "all"],
    });

    return posts.map(post => ({
      id: post.id,
      title: typeof post.title === "object" ? (post.title as { rendered: string }).rendered : post.title,
      slug: post.slug || "",
      status: post.status === "publish" ? "published" : post.status === "future" ? "scheduled" : "draft",
      url: post.link,
      updatedAt: post.date,
    }));
  }

  // ============================================
  // WEBFLOW METHODS
  // ============================================

  private async publishToWebflow(content: PublishContent): Promise<PublishResult> {
    if (!this.webflowClient || !this.connection.webflow?.siteId) {
      return { success: false, cms: "webflow", error: "Webflow not configured" };
    }

    const result = await this.webflowClient.publishBlogPost(
      this.connection.webflow.siteId,
      {
        title: content.title,
        slug: content.slug || this.generateSlug(content.title),
        body: content.content,
        summary: content.excerpt,
        seoTitle: content.seoTitle,
        metaDescription: content.metaDescription,
        author: content.author,
        category: content.categories?.[0],
        publishDate: content.publishDate,
        thumbnailUrl: content.featuredImageUrl,
      },
      {
        publishLive: content.status === "publish",
        isDraft: content.status === "draft",
      }
    );

    return {
      success: result.success,
      cms: "webflow",
      postId: result.itemId,
      url: result.url,
      error: result.error,
    };
  }

  private async updateWebflow(itemId: string, content: Partial<PublishContent>): Promise<PublishResult> {
    if (!this.webflowClient || !this.connection.webflow?.siteId) {
      return { success: false, cms: "webflow", error: "Webflow not configured" };
    }

    const collection = await this.webflowClient.findBlogCollection(
      this.connection.webflow.siteId
    );
    if (!collection) {
      return { success: false, cms: "webflow", error: "Blog collection not found" };
    }

    const result = await this.webflowClient.updateBlogPost(
      collection.id,
      itemId,
      {
        title: content.title,
        body: content.content,
        summary: content.excerpt,
        seoTitle: content.seoTitle,
        metaDescription: content.metaDescription,
      },
      {
        publishLive: content.status === "publish",
      }
    );

    return {
      success: result.success,
      cms: "webflow",
      postId: result.itemId,
      error: result.error,
    };
  }

  private async listWebflowContent(options: {
    limit?: number;
    status?: "draft" | "published" | "all";
  }): Promise<CMSContent[]> {
    if (!this.webflowClient || !this.connection.webflow?.siteId) return [];

    const { posts } = await this.webflowClient.listBlogPosts(
      this.connection.webflow.siteId,
      { limit: options.limit || 50 }
    );

    return posts
      .filter(post => {
        if (options.status === "draft") return post.isDraft;
        if (options.status === "published") return !post.isDraft;
        return true;
      })
      .map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.isDraft ? "draft" : "published" as const,
        updatedAt: post.lastUpdated,
      }));
  }

  // ============================================
  // SHOPIFY METHODS
  // ============================================

  private async publishToShopify(content: PublishContent): Promise<PublishResult> {
    if (!this.shopifyClient) {
      return { success: false, cms: "shopify", error: "Shopify not configured" };
    }

    const result = await this.shopifyClient.publishBlogPost({
      title: content.title,
      content: content.content,
      summary: content.excerpt,
      author: content.author || "CabbageSEO",
      tags: content.tags,
      imageUrl: content.featuredImageUrl,
      imageAlt: content.featuredImageAlt,
      seoTitle: content.seoTitle,
      seoDescription: content.metaDescription,
      publishNow: content.status === "publish",
      blogId: this.connection.shopify?.blogId,
    });

    return {
      success: result.success,
      cms: "shopify",
      postId: result.articleId,
      url: result.url,
      error: result.error,
    };
  }

  private async updateShopify(articleId: number, content: Partial<PublishContent>): Promise<PublishResult> {
    if (!this.shopifyClient) {
      return { success: false, cms: "shopify", error: "Shopify not configured" };
    }

    // Get the blog ID
    const { blogId } = await this.shopifyClient.listBlogPosts({
      blogId: this.connection.shopify?.blogId,
    });

    if (!blogId) {
      return { success: false, cms: "shopify", error: "Blog not found" };
    }

    const result = await this.shopifyClient.updateBlogPost(blogId, articleId, {
      title: content.title,
      content: content.content,
      summary: content.excerpt,
      tags: content.tags,
      seoTitle: content.seoTitle,
      seoDescription: content.metaDescription,
    });

    return {
      success: result.success,
      cms: "shopify",
      postId: result.articleId,
      url: result.url,
      error: result.error,
    };
  }

  private async listShopifyContent(options: {
    limit?: number;
  }): Promise<CMSContent[]> {
    if (!this.shopifyClient) return [];

    const { posts } = await this.shopifyClient.listBlogPosts({
      blogId: this.connection.shopify?.blogId,
      limit: options.limit || 50,
    });

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.handle,
      status: post.publishedAt ? "published" : "draft" as const,
      publishedAt: post.publishedAt,
    }));
  }

  // ============================================
  // GHOST METHODS
  // ============================================

  private async publishToGhost(content: PublishContent): Promise<PublishResult> {
    if (!this.ghostClient) {
      return { success: false, cms: "ghost", error: "Ghost not configured" };
    }

    const result = await this.ghostClient.publishWithSEO({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      status: content.status === "publish" ? "published" : "draft",
      tags: content.tags,
      featuredImage: content.featuredImageUrl,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
      },
    });

    return {
      success: result.success,
      cms: "ghost",
      postId: result.postId,
      url: result.url,
      error: result.error,
    };
  }

  // ============================================
  // NOTION METHODS
  // ============================================

  private async publishToNotion(content: PublishContent): Promise<PublishResult> {
    if (!this.notionClient) {
      return { success: false, cms: "notion", error: "Notion not configured" };
    }

    const result = await this.notionClient.publishWithSEO({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      status: content.status === "publish" ? "published" : "draft",
      tags: content.tags,
      coverUrl: content.featuredImageUrl,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
      },
    });

    return {
      success: result.success,
      cms: "notion",
      postId: result.pageId,
      url: result.url,
      error: result.error,
    };
  }

  // ============================================
  // HUBSPOT METHODS
  // ============================================

  private async publishToHubSpot(content: PublishContent): Promise<PublishResult> {
    if (!this.hubspotClient) {
      return { success: false, cms: "hubspot", error: "HubSpot not configured" };
    }

    const result = await this.hubspotClient.publishWithSEO({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      status: content.status === "publish" ? "published" : "draft",
      authorName: content.author,
      featuredImage: content.featuredImageUrl,
      blogId: this.connection.hubspot?.blogId,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
      },
    });

    return {
      success: result.success,
      cms: "hubspot",
      postId: result.postId,
      url: result.url,
      error: result.error,
    };
  }

  // ============================================
  // FRAMER METHODS
  // ============================================

  private async publishToFramer(content: PublishContent): Promise<PublishResult> {
    if (!this.framerClient) {
      return { success: false, cms: "framer", error: "Framer not configured" };
    }

    const result = await this.framerClient.publishWithSEO({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      status: content.status === "publish" ? "published" : "draft",
      author: content.author,
      featuredImage: content.featuredImageUrl,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
      },
    });

    return {
      success: result.success,
      cms: "framer",
      postId: result.itemId,
      url: result.url,
      error: result.error,
    };
  }

  // ============================================
  // WEBHOOK METHODS
  // ============================================

  private async publishToWebhook(content: PublishContent): Promise<PublishResult> {
    if (!this.webhookClient) {
      return { success: false, cms: "webhooks", error: "Webhook not configured" };
    }

    const result = await this.webhookClient.publishContent({
      title: content.title,
      content: content.content,
      slug: content.slug,
      excerpt: content.excerpt,
      status: content.status === "publish" ? "published" : "draft",
      tags: content.tags,
      featuredImage: content.featuredImageUrl,
      seoMeta: {
        title: content.seoTitle,
        description: content.metaDescription,
      },
    });

    return {
      success: result.success,
      cms: "webhooks",
      error: result.error,
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createCMSPublisher(connection: CMSConnection): CMSPublisher {
  return new CMSPublisher(connection);
}

/**
 * Create publisher from stored integration credentials
 */
export async function createPublisherFromIntegration(
  type: CMSType,
  credentials: Record<string, string>
): Promise<CMSPublisher | null> {
  switch (type) {
    case "wordpress":
      if (!credentials.siteUrl || !credentials.username || !credentials.appPassword) {
        return null;
      }
      return createCMSPublisher({
        type: "wordpress",
        wordpress: {
          siteUrl: credentials.siteUrl,
          username: credentials.username,
          applicationPassword: credentials.appPassword,
        },
      });

    case "webflow":
      if (!credentials.accessToken || !credentials.siteId) {
        return null;
      }
      return createCMSPublisher({
        type: "webflow",
        webflow: {
          accessToken: credentials.accessToken,
          siteId: credentials.siteId,
        },
      });

    case "shopify":
      if (!credentials.shopDomain || !credentials.accessToken) {
        return null;
      }
      return createCMSPublisher({
        type: "shopify",
        shopify: {
          shopDomain: credentials.shopDomain,
          accessToken: credentials.accessToken,
          blogId: credentials.blogId ? Number(credentials.blogId) : undefined,
        },
      });

    case "ghost":
      if (!credentials.apiUrl || !credentials.adminApiKey) {
        return null;
      }
      return createCMSPublisher({
        type: "ghost",
        ghost: {
          apiUrl: credentials.apiUrl,
          adminApiKey: credentials.adminApiKey,
        },
      });

    case "notion":
      if (!credentials.integrationToken) {
        return null;
      }
      return createCMSPublisher({
        type: "notion",
        notion: {
          integrationToken: credentials.integrationToken,
          databaseId: credentials.databaseId,
        },
      });

    case "hubspot":
      if (!credentials.accessToken) {
        return null;
      }
      return createCMSPublisher({
        type: "hubspot",
        hubspot: {
          accessToken: credentials.accessToken,
          portalId: credentials.portalId,
          blogId: credentials.blogId,
        },
      });

    case "framer":
      if (!credentials.projectId || !credentials.accessToken) {
        return null;
      }
      return createCMSPublisher({
        type: "framer",
        framer: {
          projectId: credentials.projectId,
          accessToken: credentials.accessToken,
          collectionId: credentials.collectionId,
        },
      });

    case "webhooks":
      if (!credentials.webhookUrl) {
        return null;
      }
      return createCMSPublisher({
        type: "webhooks",
        webhooks: {
          webhookUrl: credentials.webhookUrl,
          secretKey: credentials.secretKey,
        },
      });

    default:
      return null;
  }
}

