/**
 * Supabase Storage Utilities
 * For managing files in CabbageSEO buckets
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

// Bucket names
export const BUCKETS = {
  EXPORTS: "exports",
  UPLOADS: "uploads",
  CONTENT_IMAGES: "content-images",
  SCREENSHOTS: "screenshots",
  SITEMAPS: "sitemaps",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// File categories within buckets
export const FILE_CATEGORIES = {
  EXPORTS: {
    ARTICLES: "articles",
    REPORTS: "reports",
    KEYWORDS: "keywords",
  },
  UPLOADS: {
    KEYWORDS: "keywords",
    COMPETITORS: "competitors",
  },
} as const;

/**
 * Generate a storage path for a file
 */
export function getStoragePath(
  orgId: string,
  category: string,
  filename: string,
  siteId?: string,
  contentId?: string
): string {
  const parts = [orgId];
  if (siteId) parts.push(siteId);
  if (contentId) parts.push(contentId);
  parts.push(category, filename);
  return parts.join("/");
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: File | Blob | Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = await createClient();
  if (!supabase) {
    return { error: "Storage not configured" };
  }

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) {
    return { error: error.message };
  }

  // Get public URL for content-images, signed URL for others
  if (bucket === BUCKETS.CONTENT_IMAGES) {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } else {
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 3600); // 1 hour expiry
    if (urlError) {
      return { error: urlError.message };
    }
    return { url: urlData.signedUrl, path: data.path };
  }
}

/**
 * Upload file using service role (for background jobs)
 */
export async function uploadFileAsService(
  bucket: BucketName,
  path: string,
  file: File | Blob | Buffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });

  if (error) {
    return { error: error.message };
  }

  if (bucket === BUCKETS.CONTENT_IMAGES) {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } else {
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 86400); // 24 hour expiry for service uploads
    if (urlError) {
      return { error: urlError.message };
    }
    return { url: urlData.signedUrl, path: data.path };
  }
}

/**
 * Get a signed URL for downloading a file
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("[Storage] Error getting signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("[Storage] Error deleting file:", error);
    return false;
  }

  return true;
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: BucketName,
  folder: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ name: string; size: number; updatedAt: string }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: options?.limit ?? 100,
    offset: options?.offset ?? 0,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error) {
    console.error("[Storage] Error listing files:", error);
    return [];
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size ?? 0,
    updatedAt: file.updated_at ?? new Date().toISOString(),
  }));
}

// ============================================
// SPECIFIC UPLOAD HELPERS
// ============================================

/**
 * Upload an article export (HTML/Markdown)
 */
export async function uploadArticleExport(
  orgId: string,
  filename: string,
  content: string,
  format: "html" | "markdown" = "html"
): Promise<{ url: string; path: string } | { error: string }> {
  const path = getStoragePath(orgId, FILE_CATEGORIES.EXPORTS.ARTICLES, filename);
  const contentType = format === "html" ? "text/html" : "text/markdown";
  const blob = new Blob([content], { type: contentType });

  return uploadFile(BUCKETS.EXPORTS, path, blob, { contentType, upsert: true });
}

/**
 * Upload a keyword CSV export
 */
export async function uploadKeywordExport(
  orgId: string,
  filename: string,
  csvContent: string
): Promise<{ url: string; path: string } | { error: string }> {
  const path = getStoragePath(orgId, FILE_CATEGORIES.EXPORTS.KEYWORDS, filename);
  const blob = new Blob([csvContent], { type: "text/csv" });

  return uploadFile(BUCKETS.EXPORTS, path, blob, { contentType: "text/csv", upsert: true });
}

/**
 * Upload a content image
 */
export async function uploadContentImage(
  orgId: string,
  siteId: string,
  contentId: string,
  file: File | Blob,
  filename: string
): Promise<{ url: string; path: string } | { error: string }> {
  const path = getStoragePath(orgId, "", filename, siteId, contentId);
  const contentType = file instanceof File ? file.type : "image/png";

  return uploadFile(BUCKETS.CONTENT_IMAGES, path, file, { contentType, upsert: true });
}

/**
 * Upload a page screenshot (for audits)
 */
export async function uploadScreenshot(
  orgId: string,
  siteId: string,
  pageId: string,
  screenshot: Buffer,
  filename?: string
): Promise<{ url: string; path: string } | { error: string }> {
  const name = filename ?? `${Date.now()}.png`;
  const path = `${orgId}/${siteId}/${pageId}/${name}`;

  return uploadFileAsService(BUCKETS.SCREENSHOTS, path, screenshot, {
    contentType: "image/png",
    upsert: true,
  });
}

/**
 * Upload a sitemap XML
 */
export async function uploadSitemap(
  orgId: string,
  siteId: string,
  sitemapXml: string,
  filename?: string
): Promise<{ url: string; path: string } | { error: string }> {
  const name = filename ?? `sitemap-${Date.now()}.xml`;
  const path = `${orgId}/${siteId}/${name}`;
  const blob = new Blob([sitemapXml], { type: "application/xml" });

  return uploadFileAsService(BUCKETS.SITEMAPS, path, blob, {
    contentType: "application/xml",
    upsert: true,
  });
}

/**
 * Process an uploaded keyword CSV
 */
export async function processKeywordUpload(
  orgId: string,
  file: File
): Promise<{ keywords: string[]; path: string } | { error: string }> {
  const timestamp = Date.now();
  const path = getStoragePath(
    orgId,
    FILE_CATEGORIES.UPLOADS.KEYWORDS,
    `upload-${timestamp}.csv`
  );

  // Upload the file
  const uploadResult = await uploadFile(BUCKETS.UPLOADS, path, file, {
    contentType: "text/csv",
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  // Parse the CSV content
  const text = await file.text();
  const lines = text.split("\n").filter((line) => line.trim());
  const keywords = lines.slice(1).map((line) => line.split(",")[0]?.trim()).filter(Boolean);

  return { keywords, path: uploadResult.path };
}

