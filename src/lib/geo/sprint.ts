/**
 * 30-Day Sprint Framework
 *
 * Generates and manages a structured 4-week program to improve AI visibility.
 * Each action is prioritized and assigned to a week.
 *
 * Week 1: Critical sources (G2, Capterra)
 * Week 2: Comparison content + Product Hunt
 * Week 3: Authority building (Reddit, community)
 * Week 4: Review, optimize, maintain
 */

export interface SprintActionDef {
  actionType: string;
  actionTitle: string;
  actionDescription: string;
  actionUrl?: string;
  priority: number; // 1-10, lower = higher priority
  estimatedMinutes: number;
  week: number; // 1-4
  category: "source" | "content" | "technical" | "community" | "review";
}

/**
 * Generate sprint actions based on current site data.
 * Only includes actions that are relevant (e.g., skip G2 if already listed).
 */
export function generateSprintActions(
  siteData: {
    domain: string;
    geoScoreAvg: number | null;
    totalCitations: number;
    category?: string | null;
  },
  sourcesListed: string[], // e.g., ["g2.com", "capterra.com"]
): SprintActionDef[] {
  const actions: SprintActionDef[] = [];
  const listedSet = new Set(sourcesListed.map((s) => s.toLowerCase()));

  // Week 1: Critical sources
  if (!listedSet.has("g2.com")) {
    actions.push({
      actionType: "get_listed_g2",
      actionTitle: "Get listed on G2",
      actionDescription:
        "G2 is the #1 source AI uses for software recommendations. Create a free profile, add your product details, and request reviews from existing customers. This is the single highest-impact action for AI visibility.",
      actionUrl: "https://www.g2.com/products/new",
      priority: 1,
      estimatedMinutes: 120,
      week: 1,
      category: "source",
    });
  }

  if (!listedSet.has("capterra.com")) {
    actions.push({
      actionType: "get_listed_capterra",
      actionTitle: "Get listed on Capterra",
      actionDescription:
        "Capterra is the second most-cited source by AI platforms. Claim your free listing, fill out every field, and add screenshots. AI trusts comprehensive profiles.",
      actionUrl: "https://www.capterra.com/vendors/sign-up",
      priority: 2,
      estimatedMinutes: 90,
      week: 1,
      category: "source",
    });
  }

  // Week 2: Content + Product Hunt
  actions.push({
    actionType: "publish_comparison",
    actionTitle: "Publish a comparison page for your category",
    actionDescription: `AI frequently answers "vs" and "alternative to" queries. Create a detailed, honest comparison page on your site. Include features, pricing, pros/cons. This directly targets queries where AI is looking for recommendations.`,
    priority: 3,
    estimatedMinutes: 60,
    week: 2,
    category: "content",
  });

  if (!listedSet.has("producthunt.com")) {
    actions.push({
      actionType: "launch_producthunt",
      actionTitle: "Launch on Product Hunt",
      actionDescription:
        "Product Hunt is a high-authority source that AI platforms reference for new tools. Even a simple launch drives citations. Prepare a compelling tagline, screenshots, and maker comment.",
      actionUrl: "https://www.producthunt.com/posts/new",
      priority: 4,
      estimatedMinutes: 120,
      week: 2,
      category: "source",
    });
  }

  actions.push({
    actionType: "publish_alternatives",
    actionTitle: "Publish an alternatives/listicle page",
    actionDescription: `Create a "Best ${siteData.category || "tools"} for [use case]" page on your blog. Include yourself with honest analysis of strengths. AI loves well-structured listicle content.`,
    priority: 5,
    estimatedMinutes: 45,
    week: 2,
    category: "content",
  });

  // Week 3: Authority building
  actions.push({
    actionType: "reddit_presence",
    actionTitle: "Establish Reddit presence",
    actionDescription:
      "AI crawls Reddit for authentic opinions. Find 3-5 relevant subreddits and contribute genuine, helpful answers. When relevant, mention your tool. Avoid spamming — AI values authentic recommendations.",
    priority: 6,
    estimatedMinutes: 30,
    week: 3,
    category: "community",
  });

  if (!listedSet.has("trustpilot.com")) {
    actions.push({
      actionType: "get_listed_trustpilot",
      actionTitle: "Claim your Trustpilot profile",
      actionDescription:
        "Trustpilot reviews are cited by AI for credibility signals. Claim your free business profile and request reviews from customers.",
      actionUrl: "https://business.trustpilot.com/",
      priority: 7,
      estimatedMinutes: 30,
      week: 3,
      category: "source",
    });
  }

  actions.push({
    actionType: "add_faq_schema",
    actionTitle: "Add FAQ schema to your website",
    actionDescription:
      "AI platforms heavily weight structured data. Add FAQ schema (JSON-LD) to your homepage and key landing pages with common questions about your product. This directly increases your citability score.",
    priority: 8,
    estimatedMinutes: 60,
    week: 3,
    category: "technical",
  });

  // Week 4: Review and optimize
  actions.push({
    actionType: "review_progress",
    actionTitle: "Review your AI visibility progress",
    actionDescription:
      "Run a fresh check and compare results to when you started. See which actions moved the needle most. Identify remaining gaps and plan your next moves.",
    priority: 9,
    estimatedMinutes: 15,
    week: 4,
    category: "review",
  });

  actions.push({
    actionType: "optimize_content",
    actionTitle: "Optimize top pages for AI citability",
    actionDescription:
      "Review your GEO score breakdown. Focus on the lowest-scoring factors: add direct answer paragraphs, include statistics, improve structured data, and update stale content.",
    priority: 10,
    estimatedMinutes: 120,
    week: 4,
    category: "technical",
  });

  return actions;
}

/**
 * Calculate sprint progress from actions.
 */
export function calculateSprintProgress(
  actions: { status: string }[],
  sprintStartedAt: Date | string | null
): {
  totalActions: number;
  completedActions: number;
  percentComplete: number;
  currentDay: number;
  currentWeek: number;
  daysRemaining: number;
  isComplete: boolean;
} {
  const totalActions = actions.length;
  const completedActions = actions.filter(
    (a) => a.status === "completed"
  ).length;
  const percentComplete =
    totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  let currentDay = 1;
  let daysRemaining = 30;

  if (sprintStartedAt) {
    const start = new Date(sprintStartedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    currentDay = Math.min(30, Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1));
    daysRemaining = Math.max(0, 30 - currentDay + 1);
  }

  const currentWeek = Math.min(4, Math.ceil(currentDay / 7));
  const isComplete = completedActions === totalActions || currentDay > 30;

  return {
    totalActions,
    completedActions,
    percentComplete,
    currentDay,
    currentWeek,
    daysRemaining,
    isComplete,
  };
}
