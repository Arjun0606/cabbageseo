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
    queriesWon: number;
    period: string; // "7d before"
  };
  afterListing: {
    citations: number;
    queriesWon: number;
    period: string; // "7d after" or "since listing"
  };
  impact: {
    citationsGained: number;
    queriesWonGained: number;
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
  queriesWonBefore: number;
  queriesWonNow: number;
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
  queriesWonBefore: number,
  queriesWonAfter: number,
  category: string | null
): SourceImpact {
  const citationsGained = citationsAfterListing - citationsBeforeListing;
  const queriesWonGained = queriesWonAfter - queriesWonBefore;

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
      queriesWon: queriesWonBefore,
      period: "7d before listing",
    },
    afterListing: {
      citations: citationsAfterListing,
      queriesWon: queriesWonAfter,
      period: listing ? "since listing" : "current",
    },
    impact: {
      citationsGained,
      queriesWonGained,
      estimatedRevenueGained,
      isPositive: citationsGained > 0 || queriesWonGained > 0,
    },
  };
}

/**
 * Generate impact summary across all sources
 */
export function generateImpactSummary(
  listings: UserSourceListing[],
  citationsBySource: Map<string, { before: number; after: number }>,
  queriesWonHistory: { date: string; queriesWon: number }[],
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

    // Get queries won before and after listing
    const listingDate = new Date(listing.listedAt);
    const wonBefore = queriesWonHistory.filter(h => new Date(h.date) < listingDate);
    const wonAfter = queriesWonHistory.filter(h => new Date(h.date) >= listingDate);

    const avgWonBefore = wonBefore.length > 0
      ? Math.round(wonBefore.reduce((a, b) => a + b.queriesWon, 0) / wonBefore.length)
      : 0;
    const avgWonAfter = wonAfter.length > 0
      ? Math.round(wonAfter.reduce((a, b) => a + b.queriesWon, 0) / wonAfter.length)
      : queriesWonHistory[queriesWonHistory.length - 1]?.queriesWon || 0;

    const impact = calculateSourceImpact(
      source,
      listing,
      citations.before,
      citations.after,
      avgWonBefore,
      avgWonAfter,
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

  // Overall queries won change
  const queriesWonBefore = queriesWonHistory[0]?.queriesWon || 0;
  const queriesWonNow = queriesWonHistory[queriesWonHistory.length - 1]?.queriesWon || 0;

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
    queriesWonBefore,
    queriesWonNow,
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
  type: "listing" | "citation" | "visibility_change";
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
  queriesWonSnapshots: { date: Date; queriesWon: number }[]
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

  // Add visibility change events based on queries won
  for (let i = 1; i < queriesWonSnapshots.length; i++) {
    const prev = queriesWonSnapshots[i - 1];
    const curr = queriesWonSnapshots[i];
    const change = curr.queriesWon - prev.queriesWon;

    if (Math.abs(change) >= 2) {
      events.push({
        date: curr.date,
        type: "visibility_change",
        title: change > 0 ? `+${change} queries won` : `${change} queries won`,
        description: change > 0
          ? `You're now winning ${curr.queriesWon} queries (up from ${prev.queriesWon})`
          : `You're now winning ${curr.queriesWon} queries (down from ${prev.queriesWon})`,
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
): Promise<boolean> {
  // For now, return false (manual verification needed)
  // In production, you'd check the source's API or scrape
  return false;
}
