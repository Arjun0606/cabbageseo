/**
 * AI Trust Sources — The Distribution Intelligence Engine
 *
 * Trust sources vary by business type. A SaaS needs G2 and Capterra.
 * A restaurant needs Yelp and TripAdvisor. A law firm needs Avvo.
 *
 * Instead of hardcoding which sources to check, we maintain a broad
 * catalog and use AI to select the relevant ones per business.
 */

// ============================================
// TRUST SOURCE CATALOG
// ============================================

export interface TrustSource {
  domain: string;
  name: string;
  category: "review" | "directory" | "community" | "media" | "comparison";
  /** Which types of business this source is relevant for */
  relevantFor: string[];
  trustScore: number; // 1-10
  howToGetListed: string;
  estimatedEffort: "low" | "medium" | "high";
  estimatedTime: string;
}

export const TRUST_SOURCES: TrustSource[] = [
  // ---- Software / SaaS Review Sites ----
  {
    domain: "g2.com",
    name: "G2",
    category: "review",
    relevantFor: ["saas", "software", "devtools", "b2b"],
    trustScore: 10,
    howToGetListed: "Create a free vendor profile at sell.g2.com, claim your listing, and collect at least 10 verified reviews.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "capterra.com",
    name: "Capterra",
    category: "review",
    relevantFor: ["saas", "software", "b2b"],
    trustScore: 9,
    howToGetListed: "Submit your product at vendors.capterra.com for free listing. Complete profile with screenshots and pricing.",
    estimatedEffort: "low",
    estimatedTime: "1-2 weeks",
  },
  {
    domain: "trustradius.com",
    name: "TrustRadius",
    category: "review",
    relevantFor: ["saas", "software", "enterprise", "b2b"],
    trustScore: 8,
    howToGetListed: "Claim your free profile, add product details, and invite customers to leave detailed reviews.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "getapp.com",
    name: "GetApp",
    category: "review",
    relevantFor: ["saas", "software", "b2b"],
    trustScore: 7,
    howToGetListed: "Submit through Gartner Digital Markets (same network as Capterra). Profile syncs automatically.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "softwareadvice.com",
    name: "Software Advice",
    category: "review",
    relevantFor: ["saas", "software", "b2b"],
    trustScore: 7,
    howToGetListed: "Part of Gartner network. Once listed on Capterra, you appear here automatically.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },

  // ---- General Review Sites ----
  {
    domain: "trustpilot.com",
    name: "Trustpilot",
    category: "review",
    relevantFor: ["ecommerce", "saas", "service", "fintech", "b2c", "marketplace"],
    trustScore: 9,
    howToGetListed: "Claim your free business profile. Invite customers to leave reviews. Respond to feedback.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "bbb.org",
    name: "Better Business Bureau",
    category: "review",
    relevantFor: ["service", "ecommerce", "finance", "insurance", "local", "b2c"],
    trustScore: 8,
    howToGetListed: "Apply for BBB accreditation or claim your free profile at bbb.org/get-accredited.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "sitejabber.com",
    name: "Sitejabber",
    category: "review",
    relevantFor: ["ecommerce", "marketplace", "b2c", "service"],
    trustScore: 7,
    howToGetListed: "Claim your business page for free. Encourage customers to review. Respond to feedback.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },

  // ---- Local / Restaurant / Hospitality ----
  {
    domain: "yelp.com",
    name: "Yelp",
    category: "review",
    relevantFor: ["local", "restaurant", "service", "retail", "health", "beauty"],
    trustScore: 9,
    howToGetListed: "Claim your business at biz.yelp.com. Add photos, hours, and menu. Respond to reviews.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "tripadvisor.com",
    name: "TripAdvisor",
    category: "review",
    relevantFor: ["restaurant", "hospitality", "travel", "tourism", "local"],
    trustScore: 9,
    howToGetListed: "Claim your listing at tripadvisor.com/Owners. Add photos, respond to reviews, update details.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "google.com/maps",
    name: "Google Business Profile",
    category: "directory",
    relevantFor: ["local", "restaurant", "service", "retail", "health", "beauty", "professional"],
    trustScore: 10,
    howToGetListed: "Create or claim your profile at business.google.com. Add photos, hours, and respond to reviews.",
    estimatedEffort: "low",
    estimatedTime: "1-2 weeks for verification",
  },

  // ---- Professional Services ----
  {
    domain: "avvo.com",
    name: "Avvo",
    category: "directory",
    relevantFor: ["legal", "lawyer", "attorney"],
    trustScore: 8,
    howToGetListed: "Claim your free lawyer profile. Add practice areas, experience, and client reviews.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "healthgrades.com",
    name: "Healthgrades",
    category: "directory",
    relevantFor: ["health", "medical", "doctor", "dentist", "healthcare"],
    trustScore: 8,
    howToGetListed: "Claim your profile at update.healthgrades.com. Verify credentials and update practice info.",
    estimatedEffort: "low",
    estimatedTime: "1-2 weeks",
  },
  {
    domain: "zocdoc.com",
    name: "Zocdoc",
    category: "directory",
    relevantFor: ["health", "medical", "doctor", "dentist", "healthcare"],
    trustScore: 8,
    howToGetListed: "Apply to join Zocdoc's provider network. Complete verification and set up online booking.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "clutch.co",
    name: "Clutch",
    category: "review",
    relevantFor: ["agency", "consulting", "development", "design", "marketing", "b2b"],
    trustScore: 8,
    howToGetListed: "Create a free company profile. Request verified reviews from clients. Complete portfolio section.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },

  // ---- Directories ----
  {
    domain: "producthunt.com",
    name: "Product Hunt",
    category: "directory",
    relevantFor: ["saas", "software", "startup", "devtools", "app", "b2c"],
    trustScore: 9,
    howToGetListed: "Launch your product on Product Hunt. Prepare maker profile, visuals, and engage on launch day.",
    estimatedEffort: "high",
    estimatedTime: "1-2 weeks prep",
  },
  {
    domain: "alternativeto.net",
    name: "AlternativeTo",
    category: "directory",
    relevantFor: ["saas", "software", "app", "devtools"],
    trustScore: 8,
    howToGetListed: "Submit your product as an alternative to popular tools. Add description, screenshots, and features.",
    estimatedEffort: "low",
    estimatedTime: "1-3 days",
  },
  {
    domain: "saashub.com",
    name: "SaaSHub",
    category: "directory",
    relevantFor: ["saas", "software"],
    trustScore: 6,
    howToGetListed: "Submit your SaaS product with complete details. Free listing available.",
    estimatedEffort: "low",
    estimatedTime: "1-3 days",
  },
  {
    domain: "crunchbase.com",
    name: "Crunchbase",
    category: "directory",
    relevantFor: ["startup", "saas", "fintech", "b2b", "venture"],
    trustScore: 8,
    howToGetListed: "Create a free organization profile. Add funding, team, and product details.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },

  // ---- Community ----
  {
    domain: "reddit.com",
    name: "Reddit",
    category: "community",
    relevantFor: ["saas", "software", "ecommerce", "gaming", "finance", "health", "education", "startup", "devtools"],
    trustScore: 8,
    howToGetListed: "Participate authentically in relevant subreddits. Answer questions, share value. Avoid self-promotion spam.",
    estimatedEffort: "high",
    estimatedTime: "Ongoing",
  },
  {
    domain: "news.ycombinator.com",
    name: "Hacker News",
    category: "community",
    relevantFor: ["saas", "software", "devtools", "startup", "ai"],
    trustScore: 8,
    howToGetListed: "Share your product on Show HN. Engage authentically with the community. Focus on technical value.",
    estimatedEffort: "high",
    estimatedTime: "Ongoing",
  },
  {
    domain: "indiehackers.com",
    name: "Indie Hackers",
    category: "community",
    relevantFor: ["saas", "startup", "software", "bootstrapped"],
    trustScore: 7,
    howToGetListed: "Create a product page, share your journey, engage with the community.",
    estimatedEffort: "medium",
    estimatedTime: "Ongoing",
  },

  // ---- Media & Comparison ----
  {
    domain: "techcrunch.com",
    name: "TechCrunch",
    category: "media",
    relevantFor: ["saas", "startup", "fintech", "ai", "venture"],
    trustScore: 9,
    howToGetListed: "Pitch your story to reporters. Focus on unique angle, growth metrics, or funding news.",
    estimatedEffort: "high",
    estimatedTime: "Varies",
  },
  {
    domain: "zapier.com",
    name: "Zapier",
    category: "comparison",
    relevantFor: ["saas", "software", "productivity", "automation"],
    trustScore: 9,
    howToGetListed: "Build a Zapier integration. Reach out about being featured in their comparison articles and app directory.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "forbes.com",
    name: "Forbes",
    category: "media",
    relevantFor: ["finance", "saas", "ecommerce", "enterprise", "startup"],
    trustScore: 9,
    howToGetListed: "Pitch contributor articles or submit press releases for major announcements.",
    estimatedEffort: "high",
    estimatedTime: "Varies",
  },
];

// Map domain to source info
const SOURCE_MAP = new Map(TRUST_SOURCES.map(s => [s.domain, s]));

// ============================================
// RELEVANT SOURCE SELECTION
// Uses AI to pick the right sources for a business
// ============================================

/**
 * Given site context, use AI to determine which trust sources
 * are actually relevant for this business. Returns 4-8 sources.
 */
export async function selectRelevantTrustSources(
  domain: string,
  siteContext: { title: string; description: string; headings: string[] },
): Promise<TrustSource[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const hasContext = siteContext.title || siteContext.description;

  if (apiKey && hasContext) {
    try {
      const allSourceNames = TRUST_SOURCES.map(s => `${s.name} (${s.domain}) — ${s.relevantFor.join(", ")}`).join("\n");
      const contextParts = [`Domain: ${domain}`];
      if (siteContext.title) contextParts.push(`Title: ${siteContext.title}`);
      if (siteContext.description) contextParts.push(`Description: ${siteContext.description}`);
      if (siteContext.headings.length > 0) contextParts.push(`Headings: ${siteContext.headings.join(" | ")}`);

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.2",
          messages: [
            {
              role: "user",
              content: `Given a business website, select the 5-8 most relevant trust sources from the list below. These are the platforms AI uses to decide whether to recommend a brand. Only pick sources where it makes sense for THIS specific business to be listed.

For example:
- A SaaS tool → G2, Capterra, Product Hunt, Reddit, Trustpilot
- A restaurant → Yelp, Google Business Profile, TripAdvisor
- A law firm → Avvo, Google Business Profile, BBB, Yelp
- A dev tool → G2, Product Hunt, Hacker News, AlternativeTo, Reddit
- An e-commerce store → Trustpilot, BBB, Sitejabber, Google Business Profile

RESPOND with ONLY the domain names, one per line. No numbering, no extra text.

AVAILABLE SOURCES:
${allSourceNames}

BUSINESS:
${contextParts.join("\n")}`,
            },
          ],
          max_completion_tokens: 300,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = (data.choices?.[0]?.message?.content || "").trim();
        const selectedDomains = text.split("\n")
          .map((line: string) => line.trim().toLowerCase().replace(/^[-*•]\s*/, ""))
          .filter((d: string) => d.length > 3);

        const matched = selectedDomains
          .map((d: string) => TRUST_SOURCES.find(s => s.domain === d || d.includes(s.domain)))
          .filter((s: TrustSource | undefined): s is TrustSource => !!s);

        if (matched.length >= 3) {
          return matched.slice(0, 8);
        }
      }
    } catch {
      // Fall through to heuristic
    }
  }

  // Fallback: return the 6 highest-trust sources (universally useful)
  return TRUST_SOURCES
    .filter(s => s.trustScore >= 8)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 6);
}

// ============================================
// SOURCE EXTRACTION
// ============================================

/**
 * Extract source domains from AI response text and citations.
 */
export function extractSources(aiResponse: string): string[] {
  const sources: Set<string> = new Set();

  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+)/g;
  let match;
  while ((match = urlRegex.exec(aiResponse)) !== null) {
    sources.add(match[1].toLowerCase().replace(/^www\./, ""));
  }

  const sourcePatterns = [
    /source[s]?:\s*([a-zA-Z0-9.-]+\.(?:com|org|net|io|co))/gi,
    /according to\s+([a-zA-Z0-9.-]+\.(?:com|org|net|io|co))/gi,
    /cited by\s+([a-zA-Z0-9.-]+\.(?:com|org|net|io|co))/gi,
  ];
  for (const pattern of sourcePatterns) {
    while ((match = pattern.exec(aiResponse)) !== null) {
      sources.add(match[1].toLowerCase().replace(/^www\./, ""));
    }
  }

  for (const source of TRUST_SOURCES) {
    if (aiResponse.toLowerCase().includes(source.name.toLowerCase())) {
      sources.add(source.domain);
    }
  }

  return Array.from(sources);
}

/**
 * Get trust source info for a domain
 */
export function getTrustSourceInfo(domain: string): TrustSource | null {
  if (SOURCE_MAP.has(domain)) return SOURCE_MAP.get(domain)!;
  const parts = domain.split(".");
  if (parts.length > 2) {
    const main = parts.slice(-2).join(".");
    if (SOURCE_MAP.has(main)) return SOURCE_MAP.get(main)!;
  }
  return null;
}

