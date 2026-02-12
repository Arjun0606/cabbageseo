/**
 * Shared site context fetching utility.
 *
 * Scrapes a domain's homepage to extract title, description, headings,
 * and OG metadata. Used by the free scan, paid scan, trust source
 * selection, and gap analysis to understand what a business does.
 */

export interface SiteContext {
  title: string;
  description: string;
  headings: string[];
  ogData: { type?: string; siteName?: string };
}

/**
 * Fetch a domain's homepage and extract key metadata.
 * Returns empty strings/arrays on failure — never throws.
 */
export async function fetchSiteContext(domain: string): Promise<SiteContext> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://${domain}`, {
      headers: {
        "User-Agent": "CabbageSEO-Bot/1.0 (GEO Analysis)",
        Accept: "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) return { title: "", description: "", headings: [], ogData: {} };

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    const headings: string[] = [];
    const headingRegex = /<h[12][^>]*>([^<]+)<\/h[12]>/gi;
    let hMatch;
    while ((hMatch = headingRegex.exec(html)) !== null && headings.length < 8) {
      const text = hMatch[1].trim();
      if (text.length > 3 && text.length < 200) headings.push(text);
    }

    const ogTypeMatch = html.match(/<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["']/i);
    const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);

    return {
      title,
      description,
      headings,
      ogData: { type: ogTypeMatch?.[1], siteName: ogSiteMatch?.[1] },
    };
  } catch {
    return { title: "", description: "", headings: [], ogData: {} };
  }
}

/**
 * Build a concise text summary of site context for LLM prompts.
 */
export function formatSiteContextForPrompt(domain: string, ctx: SiteContext): string {
  const parts = [`Domain: ${domain}`];
  if (ctx.title) parts.push(`Title: ${ctx.title}`);
  if (ctx.description) parts.push(`Description: ${ctx.description}`);
  if (ctx.headings.length > 0) parts.push(`Key headings: ${ctx.headings.join(" | ")}`);
  if (ctx.ogData.siteName) parts.push(`Brand name: ${ctx.ogData.siteName}`);
  return parts.join("\n");
}
