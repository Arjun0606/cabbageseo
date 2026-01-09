/**
 * AI Trust Sources - The Distribution Intelligence Engine
 * 
 * This is the sticky feature:
 * - Extract WHERE AI gets its information
 * - Build Trust Map (who is on which sources)
 * - Show distribution gaps (where you need to be)
 * - Generate "how to get listed" action plans
 */

// ============================================
// KNOWN TRUST SOURCES
// ============================================

export interface TrustSource {
  domain: string;
  name: string;
  category: "review" | "directory" | "community" | "media" | "comparison";
  trustScore: number; // 1-10, how much AI trusts this source
  howToGetListed: string;
  estimatedEffort: "low" | "medium" | "high";
  estimatedTime: string;
}

// The sites AI trusts most for product recommendations
export const TRUST_SOURCES: TrustSource[] = [
  // Review Sites (highest trust)
  {
    domain: "g2.com",
    name: "G2",
    category: "review",
    trustScore: 10,
    howToGetListed: "Create a free vendor profile, claim your listing, and collect at least 10 verified reviews from customers.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "capterra.com",
    name: "Capterra",
    category: "review",
    trustScore: 9,
    howToGetListed: "Submit your product for free listing, complete your profile with screenshots and pricing, encourage customer reviews.",
    estimatedEffort: "low",
    estimatedTime: "1-2 weeks",
  },
  {
    domain: "trustradius.com",
    name: "TrustRadius",
    category: "review",
    trustScore: 8,
    howToGetListed: "Claim your free profile, add product details, and invite customers to leave detailed reviews.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "getapp.com",
    name: "GetApp",
    category: "review",
    trustScore: 7,
    howToGetListed: "Submit through Gartner Digital Markets (same as Capterra), complete profile with features and pricing.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "softwareadvice.com",
    name: "Software Advice",
    category: "review",
    trustScore: 7,
    howToGetListed: "Part of Gartner network. Once listed on Capterra, you appear here automatically.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  
  // Directories
  {
    domain: "producthunt.com",
    name: "Product Hunt",
    category: "directory",
    trustScore: 9,
    howToGetListed: "Launch your product on Product Hunt. Prepare maker profile, create good visuals, engage with community, time your launch.",
    estimatedEffort: "high",
    estimatedTime: "1-2 weeks prep",
  },
  {
    domain: "alternativeto.net",
    name: "AlternativeTo",
    category: "directory",
    trustScore: 8,
    howToGetListed: "Submit your product as an alternative to popular tools. Add description, screenshots, and key features.",
    estimatedEffort: "low",
    estimatedTime: "1-3 days",
  },
  {
    domain: "saashub.com",
    name: "SaaSHub",
    category: "directory",
    trustScore: 6,
    howToGetListed: "Submit your SaaS product with complete details. Free listing available.",
    estimatedEffort: "low",
    estimatedTime: "1-3 days",
  },
  
  // Community
  {
    domain: "reddit.com",
    name: "Reddit",
    category: "community",
    trustScore: 8,
    howToGetListed: "Participate authentically in relevant subreddits. Answer questions, share value. Avoid self-promotion spam.",
    estimatedEffort: "high",
    estimatedTime: "Ongoing",
  },
  {
    domain: "news.ycombinator.com",
    name: "Hacker News",
    category: "community",
    trustScore: 8,
    howToGetListed: "Share your product on Show HN. Engage authentically with the community. Focus on technical value.",
    estimatedEffort: "high",
    estimatedTime: "Ongoing",
  },
  {
    domain: "indiehackers.com",
    name: "Indie Hackers",
    category: "community",
    trustScore: 7,
    howToGetListed: "Create a product page, share your journey, engage with the community.",
    estimatedEffort: "medium",
    estimatedTime: "Ongoing",
  },
  
  // Media & Blogs
  {
    domain: "techcrunch.com",
    name: "TechCrunch",
    category: "media",
    trustScore: 9,
    howToGetListed: "Pitch your story to reporters. Focus on unique angle, growth metrics, or funding news.",
    estimatedEffort: "high",
    estimatedTime: "Varies",
  },
  {
    domain: "zapier.com",
    name: "Zapier Blog",
    category: "comparison",
    trustScore: 9,
    howToGetListed: "Integrate with Zapier, reach out about being featured in their comparison articles and app directory.",
    estimatedEffort: "medium",
    estimatedTime: "2-4 weeks",
  },
  {
    domain: "pcmag.com",
    name: "PCMag",
    category: "media",
    trustScore: 8,
    howToGetListed: "Submit for review, provide press materials and demo access to reviewers.",
    estimatedEffort: "medium",
    estimatedTime: "4-8 weeks",
  },
  {
    domain: "techradar.com",
    name: "TechRadar",
    category: "media",
    trustScore: 8,
    howToGetListed: "Pitch to their review team with press materials, unique angles, and demo access.",
    estimatedEffort: "medium",
    estimatedTime: "4-8 weeks",
  },
  {
    domain: "forbes.com",
    name: "Forbes",
    category: "media",
    trustScore: 9,
    howToGetListed: "Pitch contributor articles or submit press releases for major announcements.",
    estimatedEffort: "high",
    estimatedTime: "Varies",
  },
  
  // Comparison Sites
  {
    domain: "versus.com",
    name: "Versus",
    category: "comparison",
    trustScore: 6,
    howToGetListed: "Submit your product for comparison listings.",
    estimatedEffort: "low",
    estimatedTime: "1 week",
  },
  {
    domain: "slant.co",
    name: "Slant",
    category: "comparison",
    trustScore: 6,
    howToGetListed: "Add your product to relevant comparison discussions and recommendations.",
    estimatedEffort: "low",
    estimatedTime: "1-3 days",
  },
];

// Map domain to source info
const SOURCE_MAP = new Map(TRUST_SOURCES.map(s => [s.domain, s]));

// ============================================
// SOURCE EXTRACTION
// ============================================

/**
 * Extract source domains from AI response
 * Perplexity includes citations, we parse them
 */
export function extractSources(aiResponse: string): string[] {
  const sources: Set<string> = new Set();
  
  // Look for URLs in the response
  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+)/g;
  let match;
  while ((match = urlRegex.exec(aiResponse)) !== null) {
    const domain = match[1].toLowerCase().replace(/^www\./, "");
    sources.add(domain);
  }
  
  // Look for citation patterns like [1], [2] followed by source
  // Also look for "Source: X" or "According to X"
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
  
  // Check for known trust source mentions by name
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
  // Try exact match
  if (SOURCE_MAP.has(domain)) {
    return SOURCE_MAP.get(domain)!;
  }
  
  // Try without subdomain
  const parts = domain.split(".");
  if (parts.length > 2) {
    const mainDomain = parts.slice(-2).join(".");
    if (SOURCE_MAP.has(mainDomain)) {
      return SOURCE_MAP.get(mainDomain)!;
    }
  }
  
  return null;
}

// ============================================
// AI TRUST MAP
// ============================================

export interface TrustMapEntry {
  source: TrustSource;
  yourPresence: boolean;
  competitors: { name: string; present: boolean }[];
  priority: "critical" | "high" | "medium" | "low";
  actionRequired: boolean;
}

export interface TrustMap {
  entries: TrustMapEntry[];
  yourCoverage: number; // 0-100%
  avgCompetitorCoverage: number;
  criticalGaps: TrustSource[];
}

/**
 * Build AI Trust Map from check results
 */
export function buildTrustMap(
  userDomain: string,
  competitorDomains: string[],
  sourceMentions: Map<string, string[]> // source domain -> products mentioned
): TrustMap {
  const entries: TrustMapEntry[] = [];
  const userDomainClean = userDomain.toLowerCase().replace(/^www\./, "");
  
  // For each known trust source
  for (const source of TRUST_SOURCES) {
    const mentions = sourceMentions.get(source.domain) || [];
    
    // Check if user is mentioned on this source
    const yourPresence = mentions.some(m => 
      m.toLowerCase().includes(userDomainClean) ||
      userDomainClean.includes(m.toLowerCase())
    );
    
    // Check competitors
    const competitors = competitorDomains.map(comp => ({
      name: comp,
      present: mentions.some(m => 
        m.toLowerCase().includes(comp.toLowerCase()) ||
        comp.toLowerCase().includes(m.toLowerCase())
      ),
    }));
    
    const competitorsPresent = competitors.filter(c => c.present).length;
    
    // Determine priority based on:
    // 1. Source trust score
    // 2. How many competitors are there
    // 3. Whether you're missing
    let priority: TrustMapEntry["priority"] = "low";
    
    if (!yourPresence && competitorsPresent > 0) {
      if (source.trustScore >= 9) priority = "critical";
      else if (source.trustScore >= 7) priority = "high";
      else priority = "medium";
    } else if (!yourPresence && source.trustScore >= 8) {
      priority = "medium";
    }
    
    entries.push({
      source,
      yourPresence,
      competitors,
      priority,
      actionRequired: !yourPresence && (competitorsPresent > 0 || source.trustScore >= 8),
    });
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  entries.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Calculate coverage
  const yourCoverage = Math.round(
    (entries.filter(e => e.yourPresence).length / entries.length) * 100
  );
  
  const competitorCoverages = competitorDomains.map(comp => 
    entries.filter(e => e.competitors.find(c => c.name === comp && c.present)).length
  );
  const avgCompetitorCoverage = competitorCoverages.length > 0
    ? Math.round((competitorCoverages.reduce((a, b) => a + b, 0) / competitorCoverages.length / entries.length) * 100)
    : 0;
  
  const criticalGaps = entries
    .filter(e => e.priority === "critical" && !e.yourPresence)
    .map(e => e.source);
  
  return {
    entries,
    yourCoverage,
    avgCompetitorCoverage,
    criticalGaps,
  };
}

// ============================================
// DISTRIBUTION GAP ANALYSIS
// ============================================

export interface DistributionGap {
  source: TrustSource;
  competitorsOnIt: string[];
  impactScore: number; // 1-10
  actionPlan: {
    step: string;
    description: string;
  }[];
}

/**
 * Generate distribution gap analysis
 */
export function analyzeDistributionGaps(trustMap: TrustMap): DistributionGap[] {
  const gaps: DistributionGap[] = [];
  
  for (const entry of trustMap.entries) {
    if (!entry.yourPresence && entry.actionRequired) {
      const competitorsOnIt = entry.competitors
        .filter(c => c.present)
        .map(c => c.name);
      
      // Calculate impact score
      const impactScore = Math.min(10, Math.round(
        entry.source.trustScore * (1 + competitorsOnIt.length * 0.2)
      ));
      
      // Generate action plan
      const actionPlan = generateActionPlan(entry.source);
      
      gaps.push({
        source: entry.source,
        competitorsOnIt,
        impactScore,
        actionPlan,
      });
    }
  }
  
  // Sort by impact
  gaps.sort((a, b) => b.impactScore - a.impactScore);
  
  return gaps;
}

/**
 * Generate step-by-step action plan for getting listed on a source
 */
function generateActionPlan(source: TrustSource): { step: string; description: string }[] {
  const plans: Record<string, { step: string; description: string }[]> = {
    "g2.com": [
      { step: "Create vendor profile", description: "Sign up at sell.g2.com with your work email" },
      { step: "Claim your listing", description: "Search for your product and claim ownership" },
      { step: "Complete your profile", description: "Add logo, screenshots, pricing, and features" },
      { step: "Collect reviews", description: "Email customers asking for G2 reviews (need 10+ for visibility)" },
      { step: "Add G2 badges", description: "Display G2 badges on your website for social proof" },
    ],
    "capterra.com": [
      { step: "Submit your product", description: "Go to vendors.capterra.com and submit for free listing" },
      { step: "Complete profile", description: "Add detailed description, screenshots, and pricing" },
      { step: "Request reviews", description: "Send review requests to existing customers" },
      { step: "Respond to reviews", description: "Engage with feedback to show active support" },
    ],
    "producthunt.com": [
      { step: "Create maker profile", description: "Set up your Product Hunt profile and verify" },
      { step: "Prepare assets", description: "Create thumbnail, gallery images, and tagline" },
      { step: "Write description", description: "Craft compelling copy with clear value prop" },
      { step: "Build hunter network", description: "Connect with active hunters who might feature you" },
      { step: "Plan launch timing", description: "Launch Tuesday-Thursday for best visibility" },
      { step: "Engage on launch day", description: "Respond to every comment, share updates" },
    ],
    "alternativeto.net": [
      { step: "Submit product", description: "Add your product as an alternative to competitors" },
      { step: "Add details", description: "Include screenshots, description, and key features" },
      { step: "List as alternative", description: "Connect to relevant popular products" },
    ],
    "reddit.com": [
      { step: "Identify subreddits", description: "Find 3-5 relevant subreddits in your niche" },
      { step: "Participate genuinely", description: "Answer questions and provide value (no spam)" },
      { step: "Share when relevant", description: "Mention your product only when it genuinely helps" },
      { step: "Do an AMA", description: "Consider an Ask Me Anything about your expertise" },
    ],
  };
  
  return plans[source.domain] || [
    { step: "Research listing process", description: `Visit ${source.domain} and find their submission/vendor section` },
    { step: "Prepare materials", description: "Gather logo, screenshots, description, and pricing info" },
    { step: "Submit listing", description: source.howToGetListed },
    { step: "Follow up", description: "Monitor for approval and complete any verification steps" },
  ];
}

// ============================================
// WEEKLY DISTRIBUTION REPORT
// ============================================

export interface DistributionReport {
  yourCoverage: number;
  competitorAvgCoverage: number;
  coverageGap: number;
  topPriorities: DistributionGap[];
  estimatedRevenueAtRisk: number;
  weeklyActionItems: string[];
}

/**
 * Generate weekly distribution report
 */
export function generateDistributionReport(
  trustMap: TrustMap,
  gaps: DistributionGap[],
  category: string | null
): DistributionReport {
  const coverageGap = trustMap.avgCompetitorCoverage - trustMap.yourCoverage;
  
  // Estimate revenue at risk based on coverage gap
  const baseRevenue = category === "productivity" ? 20000 : 
                      category === "crm" ? 25000 :
                      category === "marketing" ? 22000 : 15000;
  const estimatedRevenueAtRisk = Math.round(baseRevenue * (coverageGap / 100));
  
  // Top priorities
  const topPriorities = gaps.slice(0, 3);
  
  // Weekly action items
  const weeklyActionItems = topPriorities.map(gap => 
    `Get listed on ${gap.source.name}: ${gap.actionPlan[0]?.description || gap.source.howToGetListed}`
  );
  
  return {
    yourCoverage: trustMap.yourCoverage,
    competitorAvgCoverage: trustMap.avgCompetitorCoverage,
    coverageGap,
    topPriorities,
    estimatedRevenueAtRisk,
    weeklyActionItems,
  };
}

