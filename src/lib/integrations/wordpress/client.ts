/**
 * WordPress REST API Client
 * Handles publishing content to WordPress sites
 */

interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

interface WPPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  status: "publish" | "draft" | "pending" | "private";
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, string>;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

interface WPMedia {
  id: number;
  source_url: string;
  title: string;
}

export class WordPressClient {
  private siteUrl: string;
  private authHeader: string;

  constructor(config: WordPressConfig) {
    this.siteUrl = config.siteUrl.replace(/\/$/, "");
    this.authHeader = `Basic ${Buffer.from(
      `${config.username}:${config.applicationPassword}`
    ).toString("base64")}`;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: unknown
  ): Promise<T> {
    const url = `${this.siteUrl}/wp-json/wp/v2${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        "Authorization": this.authHeader,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/users/me");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new post
   */
  async createPost(post: WPPost): Promise<{ id: number; link: string }> {
    const result = await this.request<{ id: number; link: string }>(
      "/posts",
      "POST",
      {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        slug: post.slug,
        status: post.status,
        categories: post.categories,
        tags: post.tags,
        featured_media: post.featured_media,
        meta: post.meta,
      }
    );

    return { id: result.id, link: result.link };
  }

  /**
   * Update an existing post
   */
  async updatePost(
    postId: number,
    updates: Partial<WPPost>
  ): Promise<{ id: number; link: string }> {
    const result = await this.request<{ id: number; link: string }>(
      `/posts/${postId}`,
      "PUT",
      updates
    );

    return { id: result.id, link: result.link };
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number, force: boolean = false): Promise<void> {
    await this.request(`/posts/${postId}?force=${force}`, "DELETE");
  }

  /**
   * Get all posts
   */
  async getPosts(
    params: {
      status?: string;
      per_page?: number;
      page?: number;
      search?: string;
    } = {}
  ): Promise<Array<{ id: number; title: string; link: string; status: string }>> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.per_page) query.set("per_page", params.per_page.toString());
    if (params.page) query.set("page", params.page.toString());
    if (params.search) query.set("search", params.search);

    const posts = await this.request<
      Array<{
        id: number;
        title: { rendered: string };
        link: string;
        status: string;
      }>
    >(`/posts?${query.toString()}`);

    return posts.map((post) => ({
      id: post.id,
      title: post.title.rendered,
      link: post.link,
      status: post.status,
    }));
  }

  /**
   * Get or create category
   */
  async getOrCreateCategory(name: string): Promise<number> {
    // Try to find existing category
    const categories = await this.request<WPCategory[]>(
      `/categories?search=${encodeURIComponent(name)}`
    );

    const existing = categories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    // Create new category
    const newCategory = await this.request<WPCategory>("/categories", "POST", {
      name,
    });

    return newCategory.id;
  }

  /**
   * Get or create tag
   */
  async getOrCreateTag(name: string): Promise<number> {
    const tags = await this.request<WPCategory[]>(
      `/tags?search=${encodeURIComponent(name)}`
    );

    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return existing.id;
    }

    const newTag = await this.request<WPCategory>("/tags", "POST", { name });
    return newTag.id;
  }

  /**
   * Upload media (image)
   */
  async uploadMedia(
    imageUrl: string,
    filename: string,
    altText?: string
  ): Promise<number> {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([imageBuffer]),
      filename
    );

    const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        "Authorization": this.authHeader,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.status}`);
    }

    const media = (await response.json()) as WPMedia;

    // Update alt text if provided
    if (altText) {
      await this.request(`/media/${media.id}`, "PUT", {
        alt_text: altText,
      });
    }

    return media.id;
  }

  /**
   * Get site info
   */
  async getSiteInfo(): Promise<{
    name: string;
    url: string;
    description: string;
  }> {
    const response = await fetch(`${this.siteUrl}/wp-json`, {
      headers: { Authorization: this.authHeader },
    });

    if (!response.ok) {
      throw new Error("Failed to get site info");
    }

    const data = await response.json();
    return {
      name: data.name,
      url: data.url,
      description: data.description,
    };
  }

  /**
   * Publish content with all metadata
   */
  async publishContent(params: {
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    excerpt?: string;
    categoryNames?: string[];
    tagNames?: string[];
    featuredImageUrl?: string;
    status?: "publish" | "draft";
  }): Promise<{ id: number; url: string }> {
    // Get or create categories
    const categoryIds: number[] = [];
    if (params.categoryNames) {
      for (const name of params.categoryNames) {
        const id = await this.getOrCreateCategory(name);
        categoryIds.push(id);
      }
    }

    // Get or create tags
    const tagIds: number[] = [];
    if (params.tagNames) {
      for (const name of params.tagNames) {
        const id = await this.getOrCreateTag(name);
        tagIds.push(id);
      }
    }

    // Upload featured image if provided
    let featuredMediaId: number | undefined;
    if (params.featuredImageUrl) {
      try {
        featuredMediaId = await this.uploadMedia(
          params.featuredImageUrl,
          `${params.slug || "image"}-featured.jpg`,
          params.title
        );
      } catch (e) {
        console.error("Failed to upload featured image:", e);
      }
    }

    // Create the post
    const post = await this.createPost({
      title: params.title,
      content: params.content,
      excerpt: params.excerpt,
      slug: params.slug,
      status: params.status || "draft",
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      tags: tagIds.length > 0 ? tagIds : undefined,
      featured_media: featuredMediaId,
      meta: {
        ...(params.metaTitle && { _yoast_wpseo_title: params.metaTitle }),
        ...(params.metaDescription && {
          _yoast_wpseo_metadesc: params.metaDescription,
        }),
      },
    });

    return { id: post.id, url: post.link };
  }
}

/**
 * Create WordPress client from stored credentials
 */
export function createWordPressClient(credentials: {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): WordPressClient {
  return new WordPressClient(credentials);
}

