/**
 * AI Impact Tracking - The Missing 10%
 * 
 * This is what turns CabbageSEO from a spy tool into a growth machine.
 * 
 * Tracks:
 * - Which sources the user is listed on
 * - When they got listed
 * - How AI mentions changed after listing
 * - Attribution: "You got listed on G2 → +5 recommendations"
 */

import { TRUST_SOURCES, type TrustSource } from "./sources";

// ============================================
// TYPES
// ============================================

export interface UserSourceListing {
  id: string;
  siteId: string;
  sourceDomain: string;
  sourceName: string;
  listedAt: Date;
  verifiedAt?: Date;
  profileUrl?: string;
  status: "pending" | "verified" | "unverified";
}

export interface SourceImpact {
  source: TrustSource;
  listing: UserSourceListing | null;
  beforeListing: {
    citations: number;
    aiMarketShare: number;
    period: string; // "7d before"
  };
  afterListing: {
    citations: number;
    aiMarketShare: number;
    period: string; // "7d after" or "since listing"
  };
  impact: {
    citationsGained: number;
    marketShareGained: number;
    estimatedRevenueGained: number;
    isPositive: boolean;
  };
}

export interface ImpactSummary {
  totalSourcesListed: number;
  totalSourcesNotListed: number;
  citationsBeforeListings: number;
  citationsAfterListings: number;
  totalCitationsGained: number;
  marketShareBefore: number;
  marketShareNow: number;
  estimatedRevenueGained: number;
  topWins: SourceImpact[];
  pendingOpportunities: TrustSource[];
}

// ============================================
// IMPACT CALCULATIONS
// ============================================

/**
 * Calculate the impact of getting listed on a source
 */
export function calculateSourceImpact(
  source: TrustSource,
  listing: UserSourceListing | null,
  citationsBeforeListing: number,
  citationsAfterListing: number,
  marketShareBefore: number,
  marketShareAfter: number,
  category: string | null
): SourceImpact {
  const citationsGained = citationsAfterListing - citationsBeforeListing;
  const marketShareGained = marketShareAfter - marketShareBefore;
  
  // Estimate revenue based on category and citations gained
  const revenuePerCitation = category === "saas" ? 500 :
                             category === "ecommerce" ? 300 :
                             category === "agency" ? 800 : 400;
  const estimatedRevenueGained = citationsGained * revenuePerCitation;

  return {
    source,
    listing,
    beforeListing: {
      citations: citationsBeforeListing,
      aiMarketShare: marketShareBefore,
      period: "7d before listing",
    },
    afterListing: {
      citations: citationsAfterListing,
      aiMarketShare: marketShareAfter,
      period: listing ? "since listing" : "current",
    },
    impact: {
      citationsGained,
      marketShareGained,
      estimatedRevenueGained,
      isPositive: citationsGained > 0 || marketShareGained > 0,
    },
  };
}

/**
 * Generate impact summary across all sources
 */
export function generateImpactSummary(
  listings: UserSourceListing[],
  citationsBySource: Map<string, { before: number; after: number }>,
  marketShareHistory: { date: string; share: number }[],
  category: string | null
): ImpactSummary {
  const listedDomains = new Set(listings.map(l => l.sourceDomain));
  
  let totalCitationsBefore = 0;
  let totalCitationsAfter = 0;
  
  const impacts: SourceImpact[] = [];
  
  for (const listing of listings) {
    const source = TRUST_SOURCES.find(s => s.domain === listing.sourceDomain);
    if (!source) continue;
    
    const citations = citationsBySource.get(listing.sourceDomain) || { before: 0, after: 0 };
    totalCitationsBefore += citations.before;
    totalCitationsAfter += citations.after;
    
    // Get market share before and after
    const listingDate = new Date(listing.listedAt);
    const sharesBefore = marketShareHistory.filter(h => new Date(h.date) < listingDate);
    const sharesAfter = marketShareHistory.filter(h => new Date(h.date) >= listingDate);
    
    const avgShareBefore = sharesBefore.length > 0 
      ? sharesBefore.reduce((a, b) => a + b.share, 0) / sharesBefore.length 
      : 0;
    const avgShareAfter = sharesAfter.length > 0 
      ? sharesAfter.reduce((a, b) => a + b.share, 0) / sharesAfter.length 
      : marketShareHistory[marketShareHistory.length - 1]?.share || 0;
    
    const impact = calculateSourceImpact(
      source,
      listing,
      citations.before,
      citations.after,
      avgShareBefore,
      avgShareAfter,
      category
    );
    
    impacts.push(impact);
  }
  
  // Sort by impact
  const topWins = impacts
    .filter(i => i.impact.isPositive)
    .sort((a, b) => b.impact.citationsGained - a.impact.citationsGained)
    .slice(0, 5);
  
  // Find pending opportunities (high trust sources not listed on)
  const pendingOpportunities = TRUST_SOURCES
    .filter(s => !listedDomains.has(s.domain))
    .filter(s => s.trustScore >= 7)
    .slice(0, 5);
  
  // Overall market share change
  const marketShareBefore = marketShareHistory[0]?.share || 0;
  const marketShareNow = marketShareHistory[marketShareHistory.length - 1]?.share || 0;
  
  // Estimate total revenue gained
  const revenuePerCitation = category === "saas" ? 500 :
                             category === "ecommerce" ? 300 :
                             category === "agency" ? 800 : 400;
  const totalCitationsGained = totalCitationsAfter - totalCitationsBefore;
  
  return {
    totalSourcesListed: listings.length,
    totalSourcesNotListed: TRUST_SOURCES.length - listings.length,
    citationsBeforeListings: totalCitationsBefore,
    citationsAfterListings: totalCitationsAfter,
    totalCitationsGained,
    marketShareBefore,
    marketShareNow,
    estimatedRevenueGained: Math.max(0, totalCitationsGained * revenuePerCitation),
    topWins,
    pendingOpportunities,
  };
}

// ============================================
// TIMELINE GENERATION
// ============================================

export interface ImpactEvent {
  date: Date;
  type: "listing" | "citation" | "market_share_change";
  title: string;
  description: string;
  impact: "positive" | "neutral" | "negative";
  value?: number;
}

/**
 * Generate a timeline of impact events
 */
export function generateImpactTimeline(
  listings: UserSourceListing[],
  citations: { citedAt: Date; query: string; platform: string }[],
  marketShareSnapshots: { date: Date; share: number }[]
): ImpactEvent[] {
  const events: ImpactEvent[] = [];
  
  // Add listing events
  for (const listing of listings) {
    events.push({
      date: new Date(listing.listedAt),
      type: "listing",
      title: `Listed on ${listing.sourceName}`,
      description: `You got listed on ${listing.sourceName}. AI will start finding you here.`,
      impact: "positive",
    });
  }
  
  // Add citation events (group by day)
  const citationsByDay = new Map<string, typeof citations>();
  for (const c of citations) {
    const day = new Date(c.citedAt).toISOString().split("T")[0];
    if (!citationsByDay.has(day)) citationsByDay.set(day, []);
    citationsByDay.get(day)!.push(c);
  }
  
  for (const [day, dayCitations] of citationsByDay) {
    if (dayCitations.length >= 3) {
      events.push({
        date: new Date(day),
        type: "citation",
        title: `+${dayCitations.length} AI recommendations`,
        description: `AI mentioned you ${dayCitations.length} times today across ${new Set(dayCitations.map(c => c.platform)).size} platforms.`,
        impact: "positive",
        value: dayCitations.length,
      });
    }
  }
  
  // Add market share change events
  for (let i = 1; i < marketShareSnapshots.length; i++) {
    const prev = marketShareSnapshots[i - 1];
    const curr = marketShareSnapshots[i];
    const change = curr.share - prev.share;
    
    if (Math.abs(change) >= 5) {
      events.push({
        date: curr.date,
        type: "market_share_change",
        title: change > 0 ? `Market share +${change}%` : `Market share ${change}%`,
        description: change > 0 
          ? `Your AI market share increased from ${prev.share}% to ${curr.share}%`
          : `Your AI market share decreased from ${prev.share}% to ${curr.share}%`,
        impact: change > 0 ? "positive" : "negative",
        value: change,
      });
    }
  }
  
  // Sort by date descending
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return events;
}

// ============================================
// SOURCE VERIFICATION
// ============================================

/**
 * Check if a site is actually listed on a source
 * This is a simple check - in production you'd want to scrape/verify
 */
export async function verifySourceListing(
  userDomain: string,
  sourceDomain: string
): Promise<{ verified: boolean; profileUrl?: string }> {
  // For now, we trust user input
  // In production, you could:
  // 1. Scrape the source site
  // 2. Use source APIs (G2, Capterra have APIs)
  // 3. Check for backlinks
  
  return {
    verified: true, // User self-reports
    profileUrl: undefined,
  };
}

// ============================================
// ATTRIBUTION
// ============================================

/**
 * Attribute a citation to a source listing
 * If AI mentioned the user and cited a source they're listed on,
 * we can attribute that citation to the listing
 */
export function attributeCitationToListing(
  citationSnippet: string,
  userListings: UserSourceListing[]
): UserSourceListing | null {
  const snippetLower = citationSnippet.toLowerCase();
  
  for (const listing of userListings) {
    // Check if the citation mentions the source
    if (snippetLower.includes(listing.sourceDomain) ||
        snippetLower.includes(listing.sourceName.toLowerCase())) {
      return listing;
    }
  }
  
  return null;
}

// ============================================
// WEEKLY IMPACT REPORT
// ============================================

export interface WeeklyImpactReport {
  weekStart: Date;
  weekEnd: Date;
  newListings: UserSourceListing[];
  citationsThisWeek: number;
  citationsLastWeek: number;
  citationsChange: number;
  marketShareThisWeek: number;
  marketShareLastWeek: number;
  marketShareChange: number;
  topWin: SourceImpact | null;
  recommendedAction: string;
  estimatedRevenueGained: number;
}

/**
 * Generate weekly impact report for email
 */
export function generateWeeklyImpactReport(
  listings: UserSourceListing[],
  citationsThisWeek: number,
  citationsLastWeek: number,
  marketShareThisWeek: number,
  marketShareLastWeek: number,
  topImpacts: SourceImpact[],
  pendingOpportunities: TrustSource[],
  category: string | null
): WeeklyImpactReport {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const newListings = listings.filter(l => 
    new Date(l.listedAt) >= weekStart
  );
  
  const citationsChange = citationsThisWeek - citationsLastWeek;
  const marketShareChange = marketShareThisWeek - marketShareLastWeek;
  
  // Find top win
  const topWin = topImpacts.find(i => i.impact.isPositive) || null;
  
  // Generate recommended action
  let recommendedAction = "";
  if (pendingOpportunities.length > 0) {
    const top = pendingOpportunities[0];
    recommendedAction = `Get listed on ${top.name}: ${top.howToGetListed.split(".")[0]}.`;
  } else if (citationsChange < 0) {
    recommendedAction = "Review your listings and update profiles with fresh content.";
  } else {
    recommendedAction = "Keep monitoring! Your AI visibility is growing.";
  }
  
  // Estimate revenue
  const revenuePerCitation = category === "saas" ? 500 :
                             category === "ecommerce" ? 300 :
                             category === "agency" ? 800 : 400;
  
  return {
    weekStart,
    weekEnd: now,
    newListings,
    citationsThisWeek,
    citationsLastWeek,
    citationsChange,
    marketShareThisWeek,
    marketShareLastWeek,
    marketShareChange,
    topWin,
    recommendedAction,
    estimatedRevenueGained: Math.max(0, citationsChange * revenuePerCitation),
  };
}

// ============================================
// GOAL TRACKING
// ============================================

export interface ImpactGoal {
  type: "citations" | "market_share" | "sources";
  target: number;
  current: number;
  deadline: Date;
  progress: number; // 0-100%
}

export function calculateGoalProgress(
  currentCitations: number,
  currentMarketShare: number,
  currentSources: number,
  targetCitations: number,
  targetMarketShare: number,
  targetSources: number
): ImpactGoal[] {
  return [
    {
      type: "citations",
      target: targetCitations,
      current: currentCitations,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      progress: Math.min(100, Math.round((currentCitations / targetCitations) * 100)),
    },
    {
      type: "market_share",
      target: targetMarketShare,
      current: currentMarketShare,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: Math.min(100, Math.round((currentMarketShare / targetMarketShare) * 100)),
    },
    {
      type: "sources",
      target: targetSources,
      current: currentSources,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progress: Math.min(100, Math.round((currentSources / targetSources) * 100)),
    },
  ];
}

