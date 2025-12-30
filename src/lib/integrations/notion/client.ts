/**
 * Notion API Client for CabbageSEO
 * 
 * Full integration for:
 * - Creating pages in databases
 * - Managing content blocks
 * - Publishing blog content
 */

// ============================================
// TYPES
// ============================================

export interface NotionConfig {
  integrationToken: string;  // Internal integration token
  databaseId?: string;       // Database to publish to
}

export interface NotionPage {
  id?: string;
  title: string;
  content?: string;
  properties?: Record<string, unknown>;
  icon?: { type: "emoji"; emoji: string } | { type: "external"; external: { url: string } };
  cover?: { type: "external"; external: { url: string } };
}

export interface NotionBlock {
  object: "block";
  type: string;
  [key: string]: unknown;
}

export interface PublishResult {
  success: boolean;
  pageId?: string;
  url?: string;
  error?: string;
}

// ============================================
// NOTION CLIENT
// ============================================

export class NotionClient {
  private token: string;
  private databaseId?: string;
  private baseUrl = "https://api.notion.com/v1";
  private notionVersion = "2022-06-28";

  constructor(config: NotionConfig) {
    this.token = config.integrationToken;
    this.databaseId = config.databaseId;
  }

  /**
   * Make authenticated request to Notion API
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
        "Notion-Version": this.notionVersion,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Notion API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test connection to Notion
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/users/me");
      return true;
    } catch (error) {
      console.error("Notion connection test failed:", error);
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getUser(): Promise<{ id: string; name: string }> {
    const response = await this.request<{ id: string; name: string }>("/users/me");
    return response;
  }

  /**
   * Convert HTML/Markdown to Notion blocks
   */
  private contentToBlocks(content: string): NotionBlock[] {
    const blocks: NotionBlock[] = [];
    
    // Split content into paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check for headings (## or ###)
      if (trimmed.startsWith("### ")) {
        blocks.push({
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: [{ type: "text", text: { content: trimmed.slice(4) } }],
          },
        });
      } else if (trimmed.startsWith("## ")) {
        blocks.push({
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: trimmed.slice(3) } }],
          },
        });
      } else if (trimmed.startsWith("# ")) {
        blocks.push({
          object: "block",
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: trimmed.slice(2) } }],
          },
        });
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        // Bullet list
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: trimmed.slice(2) } }],
          },
        });
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        blocks.push({
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: trimmed.replace(/^\d+\.\s/, "") } }],
          },
        });
      } else {
        // Regular paragraph
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: trimmed } }],
          },
        });
      }
    }

    return blocks;
  }

  // ============================================
  // DATABASES
  // ============================================

  /**
   * List databases the integration has access to
   */
  async listDatabases(): Promise<Array<{ id: string; title: string }>> {
    const response = await this.request<{ results: Array<{ id: string; title: Array<{ plain_text: string }> }> }>(
      "/search",
      {
        method: "POST",
        body: JSON.stringify({
          filter: { property: "object", value: "database" },
        }),
      }
    );

    return response.results.map(db => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
    }));
  }

  /**
   * Get database schema
   */
  async getDatabase(databaseId: string): Promise<{ id: string; properties: Record<string, unknown> }> {
    return this.request(`/databases/${databaseId}`);
  }

  // ============================================
  // PAGES
  // ============================================

  /**
   * Create a page in a database
   */
  async createPage(options: {
    databaseId?: string;
    title: string;
    content: string;
    properties?: Record<string, unknown>;
    coverUrl?: string;
  }): Promise<PublishResult> {
    try {
      const dbId = options.databaseId || this.databaseId;
      if (!dbId) {
        throw new Error("Database ID is required");
      }

      const blocks = this.contentToBlocks(options.content);

      // Default properties for a typical blog database
      const properties: Record<string, unknown> = {
        // Try common title property names
        Title: { title: [{ text: { content: options.title } }] },
        Name: { title: [{ text: { content: options.title } }] },
        ...options.properties,
      };

      const body: Record<string, unknown> = {
        parent: { database_id: dbId },
        properties,
        children: blocks,
      };

      if (options.coverUrl) {
        body.cover = { type: "external", external: { url: options.coverUrl } };
      }

      const response = await this.request<{ id: string; url: string }>(
        "/pages",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        pageId: response.id,
        url: response.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create page",
      };
    }
  }

  /**
   * Update a page
   */
  async updatePage(pageId: string, options: {
    properties?: Record<string, unknown>;
    archived?: boolean;
  }): Promise<PublishResult> {
    try {
      const response = await this.request<{ id: string; url: string }>(
        `/pages/${pageId}`,
        {
          method: "PATCH",
          body: JSON.stringify(options),
        }
      );

      return {
        success: true,
        pageId: response.id,
        url: response.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update page",
      };
    }
  }

  /**
   * Append blocks to a page
   */
  async appendBlocks(pageId: string, content: string): Promise<boolean> {
    try {
      const blocks = this.contentToBlocks(content);
      
      await this.request(
        `/blocks/${pageId}/children`,
        {
          method: "PATCH",
          body: JSON.stringify({ children: blocks }),
        }
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Publish content with SEO properties
   */
  async publishWithSEO(options: {
    title: string;
    content: string;
    slug?: string;
    excerpt?: string;
    status?: "draft" | "published";
    tags?: string[];
    coverUrl?: string;
    seoMeta?: {
      title?: string;
      description?: string;
    };
  }): Promise<PublishResult> {
    // Build properties based on common blog database schemas
    const properties: Record<string, unknown> = {};

    if (options.slug) {
      properties.Slug = { rich_text: [{ text: { content: options.slug } }] };
    }

    if (options.excerpt) {
      properties.Excerpt = { rich_text: [{ text: { content: options.excerpt } }] };
      properties.Description = { rich_text: [{ text: { content: options.excerpt } }] };
    }

    if (options.status) {
      properties.Status = { select: { name: options.status === "published" ? "Published" : "Draft" } };
    }

    if (options.tags && options.tags.length > 0) {
      properties.Tags = { multi_select: options.tags.map(name => ({ name })) };
    }

    if (options.seoMeta?.title) {
      properties["SEO Title"] = { rich_text: [{ text: { content: options.seoMeta.title } }] };
    }

    if (options.seoMeta?.description) {
      properties["SEO Description"] = { rich_text: [{ text: { content: options.seoMeta.description } }] };
    }

    return this.createPage({
      title: options.title,
      content: options.content,
      properties,
      coverUrl: options.coverUrl,
    });
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

export function createNotionClient(config: NotionConfig): NotionClient {
  return new NotionClient(config);
}

