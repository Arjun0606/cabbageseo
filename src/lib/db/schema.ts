import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// ENUMS
// ============================================

export const planEnum = pgEnum("plan", ["starter", "pro", "pro_plus"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "paused",
]);
export const roleEnum = pgEnum("role", ["owner", "admin", "editor", "viewer"]);
export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "researching",
  "writing",
  "draft",
  "review",
  "approved",
  "scheduled",
  "published",
  "updating",
]);
export const keywordStatusEnum = pgEnum("keyword_status", [
  "discovered",
  "analyzed",
  "clustered",
  "queued",
  "writing",
  "published",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "queued",
  "running",
  "completed",
  "failed",
  "canceled",
]);
export const taskTypeEnum = pgEnum("task_type", [
  "research",
  "cluster",
  "write",
  "optimize",
  "publish",
  "crawl",
  "audit",
  "refresh",
  "link",
]);
export const issueTypeEnum = pgEnum("issue_type", [
  // SEO issues
  "missing_meta_title",
  "missing_meta_description",
  "duplicate_title",
  "thin_content",
  "broken_link",
  "orphan_page",
  "redirect_chain",
  "slow_page",
  "missing_h1",
  "multiple_h1",
  "missing_alt",
  "missing_schema",
  // AIO issues
  "aio_low_entity_density",
  "aio_poor_answer_structure",
  "aio_missing_faq",
  "aio_missing_howto",
  "aio_weak_quotability",
  "aio_missing_definitions",
  "aio_no_expert_attribution",
  "aio_ambiguous_context",
  "aio_stale_content",
]);
export const issueSeverityEnum = pgEnum("issue_severity", ["critical", "warning", "info"]);
export const cmsTypeEnum = pgEnum("cms_type", ["wordpress", "webflow", "shopify", "ghost", "custom"]);
export const integrationStatusEnum = pgEnum("integration_status", ["active", "error", "disconnected"]);

// ============================================
// ORGANIZATIONS & USERS
// ============================================

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),

    // Billing
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: planEnum("plan").notNull().default("starter"),
    billingInterval: billingIntervalEnum("billing_interval").default("monthly"),
    subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trialing"),
    trialEndsAt: timestamp("trial_ends_at"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

    // Add-ons
    autopilotEnabled: boolean("autopilot_enabled").default(false),

    // Settings
    settings: jsonb("settings").default({}),
    brandVoice: text("brand_voice"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("org_slug_idx").on(table.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Auth
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").default(false),

    // Profile
    name: text("name"),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").notNull().default("editor"),

    // OAuth
    googleId: text("google_id"),

    // Activity
    lastLoginAt: timestamp("last_login_at"),
    lastActiveAt: timestamp("last_active_at"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_email_idx").on(table.email),
    index("user_org_idx").on(table.organizationId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("session_token_idx").on(table.token)]
);

// ============================================
// BILLING & USAGE
// ============================================

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Period
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),

    // Usage counts
    articlesGenerated: integer("articles_generated").default(0).notNull(),
    keywordsAnalyzed: integer("keywords_analyzed").default(0).notNull(),
    serpCalls: integer("serp_calls").default(0).notNull(),
    pagesCrawled: integer("pages_crawled").default(0).notNull(),
    optimizations: integer("optimizations").default(0).notNull(),

    // Limits (snapshot from plan at period start)
    articlesLimit: integer("articles_limit").notNull(),
    keywordsLimit: integer("keywords_limit").notNull(),
    serpCallsLimit: integer("serp_calls_limit").notNull(),
    crawlPagesLimit: integer("crawl_pages_limit").notNull(),

    // On-Demand Usage (Cursor-style)
    onDemandEnabled: boolean("on_demand_enabled").default(true),
    onDemandSpendLimitCents: integer("on_demand_spend_limit_cents").default(30000), // $300 default
    onDemandSpentCents: integer("on_demand_spent_cents").default(0),

    // Overages calculated
    overagesCalculated: boolean("overages_calculated").default(false),
    overagesAmountCents: integer("overages_amount_cents").default(0),
    overagesInvoiceId: text("overages_invoice_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("usage_org_period_idx").on(table.organizationId, table.periodStart)]
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    usageRecordId: uuid("usage_record_id")
      .references(() => usageRecords.id, { onDelete: "cascade" })
      .notNull(),

    // Event details
    eventType: text("event_type").notNull(),
    quantity: integer("quantity").notNull().default(1),

    // Cost tracking
    internalCostCents: integer("internal_cost_cents").notNull(),
    isOverage: boolean("is_overage").default(false),

    // Context
    resourceId: uuid("resource_id"),
    resourceType: text("resource_type"),
    metadata: jsonb("metadata").default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("usage_event_org_idx").on(table.organizationId, table.createdAt)]
);

// ============================================
// CREDIT BALANCE
// ============================================

export const creditBalance = pgTable(
  "credit_balance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Prepaid credits (purchased separately)
    prepaidCredits: integer("prepaid_credits").default(0).notNull(),

    // Bonus credits (promotional, referrals, etc.)
    bonusCredits: integer("bonus_credits").default(0).notNull(),

    // Expiration
    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("credit_balance_org_idx").on(table.organizationId)]
);

// ============================================
// USAGE (Monthly usage tracking)
// ============================================

export const usage = pgTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Period (YYYY-MM)
    period: text("period").notNull(),

    // Usage counts
    articlesGenerated: integer("articles_generated").default(0),
    keywordsAnalyzed: integer("keywords_analyzed").default(0),
    serpCalls: integer("serp_calls").default(0),
    pagesCrawled: integer("pages_crawled").default(0),
    aioAnalyses: integer("aio_analyses").default(0),

    // Limits snapshot
    articlesLimit: integer("articles_limit").default(0),
    keywordsLimit: integer("keywords_limit").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("usage_org_idx").on(table.organizationId),
    index("usage_period_idx").on(table.period),
    uniqueIndex("usage_org_period_unique").on(table.organizationId, table.period),
  ]
);

// ============================================
// CONTENT IDEAS
// ============================================

export const contentIdeas = pgTable(
  "content_ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),

    // Idea details
    title: text("title").notNull(),
    description: text("description"),
    targetKeyword: text("target_keyword"),
    searchVolume: integer("search_volume"),
    difficulty: integer("difficulty"),

    // Classification
    type: text("type"), // blog, product, landing, comparison
    priority: text("priority").default("medium"), // high, medium, low

    // Status
    status: text("status").default("idea"), // idea, queued, writing, published
    contentId: uuid("content_id"), // links to content table once created

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("content_ideas_site_idx").on(table.siteId),
    index("content_ideas_status_idx").on(table.status),
  ]
);

// ============================================
// INTEGRATIONS
// ============================================

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Integration type (google_search_console, google_analytics, wordpress, webflow, etc.)
    type: text("type").notNull(),

    // Encrypted credentials
    credentials: jsonb("credentials").default({}).notNull(),

    // Status
    status: integrationStatusEnum("status").default("active").notNull(),
    error: text("error"),

    // Sync tracking
    lastSyncedAt: timestamp("last_synced_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("integrations_org_idx").on(table.organizationId),
    index("integrations_type_idx").on(table.type),
    uniqueIndex("integrations_org_type_unique").on(table.organizationId, table.type),
  ]
);

// ============================================
// SITES
// ============================================

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Basic info
    domain: text("domain").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    // CMS Integration
    cmsType: cmsTypeEnum("cms_type"),
    cmsUrl: text("cms_url"),
    cmsCredentials: jsonb("cms_credentials"),
    cmsConnected: boolean("cms_connected").default(false),
    cmsLastSync: timestamp("cms_last_sync"),

    // GSC Integration
    gscConnected: boolean("gsc_connected").default(false),
    gscPropertyUrl: text("gsc_property_url"),
    gscCredentials: jsonb("gsc_credentials"),
    gscLastSync: timestamp("gsc_last_sync"),

    // Crawl state
    lastCrawlAt: timestamp("last_crawl_at"),
    lastCrawlPagesCount: integer("last_crawl_pages_count"),

    // Site settings
    settings: jsonb("settings").default({}),
    brandVoice: text("brand_voice"),
    targetAudience: text("target_audience"),
    mainTopics: jsonb("main_topics").default([]),

    // Autopilot settings
    autopilotEnabled: boolean("autopilot_enabled").default(false),
    autopilotSettings: jsonb("autopilot_settings").default({}),

    // AIO (AI Optimization) settings
    aioEnabled: boolean("aio_enabled").default(true),
    aioScoreAvg: integer("aio_score_avg"),
    aioLastAnalyzed: timestamp("aio_last_analyzed"),

    // Status
    isActive: boolean("is_active").default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("site_org_idx").on(table.organizationId),
    index("site_domain_idx").on(table.domain),
  ]
);

// ============================================
// KEYWORDS
// ============================================

export const keywordClusters = pgTable(
  "keyword_clusters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),

    name: text("name").notNull(),
    description: text("description"),
    pillarKeyword: text("pillar_keyword"),

    // Cluster metrics
    totalVolume: integer("total_volume").default(0),
    avgDifficulty: decimal("avg_difficulty", { precision: 5, scale: 2 }),
    keywordCount: integer("keyword_count").default(0),

    // Content planning
    suggestedArticles: integer("suggested_articles"),
    publishedArticles: integer("published_articles").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("cluster_site_idx").on(table.siteId)]
);

export const keywords = pgTable(
  "keywords",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    clusterId: uuid("cluster_id").references(() => keywordClusters.id, { onDelete: "set null" }),

    // Keyword data
    keyword: text("keyword").notNull(),
    volume: integer("volume"),
    difficulty: integer("difficulty"),
    cpc: decimal("cpc", { precision: 10, scale: 2 }),

    // Intent & classification
    intent: text("intent"),
    category: text("category"),

    // SERP data
    serpFeatures: jsonb("serp_features").default([]),
    serpLastFetched: timestamp("serp_last_fetched"),

    // Ranking data
    currentPosition: decimal("current_position", { precision: 5, scale: 2 }),
    previousPosition: decimal("previous_position", { precision: 5, scale: 2 }),
    impressions: integer("impressions"),
    clicks: integer("clicks"),
    ctr: decimal("ctr", { precision: 5, scale: 4 }),
    rankingUrl: text("ranking_url"),
    rankingLastUpdated: timestamp("ranking_last_updated"),

    // Workflow
    status: keywordStatusEnum("status").default("discovered"),
    priority: integer("priority").default(50),

    // Related content (FK added after content table is defined)
    contentId: uuid("content_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("keyword_site_idx").on(table.siteId),
    index("keyword_cluster_idx").on(table.clusterId),
    index("keyword_status_idx").on(table.status),
    index("keywords_content_id_idx").on(table.contentId),
  ]
);

// Note: keywords.contentId FK to content.id is added via migration
// (004_keywords_content_fk.sql) since content is defined after keywords

// ============================================
// CONTENT
// ============================================

export const content = pgTable(
  "content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    keywordId: uuid("keyword_id").references(() => keywords.id, { onDelete: "set null" }),
    clusterId: uuid("cluster_id").references(() => keywordClusters.id, { onDelete: "set null" }),

    // Content
    title: text("title").notNull(),
    slug: text("slug"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    body: text("body"),
    bodyFormat: text("body_format").default("html"),
    excerpt: text("excerpt"),

    // Structure
    outline: jsonb("outline"),
    tableOfContents: jsonb("table_of_contents"),

    // Schema markup
    schemaMarkup: jsonb("schema_markup"),
    hasFaqSchema: boolean("has_faq_schema").default(false),
    hasHowToSchema: boolean("has_how_to_schema").default(false),
    hasArticleSchema: boolean("has_article_schema").default(false),

    // Internal linking
    internalLinks: jsonb("internal_links").default([]),
    suggestedInternalLinks: jsonb("suggested_internal_links").default([]),

    // Metrics
    wordCount: integer("word_count"),
    readingTime: integer("reading_time"),

    // Scoring
    seoScore: integer("seo_score"),
    readabilityScore: integer("readability_score"),
    keywordDensity: decimal("keyword_density", { precision: 5, scale: 4 }),

    // Images
    featuredImage: text("featured_image"),
    images: jsonb("images").default([]),

    // Workflow
    status: contentStatusEnum("status").default("idea"),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),

    // Publishing
    publishedUrl: text("published_url"),
    publishedAt: timestamp("published_at"),
    cmsPostId: text("cms_post_id"),
    scheduledFor: timestamp("scheduled_for"),

    // Revision tracking
    version: integer("version").default(1),
    lastEditedBy: uuid("last_edited_by").references(() => users.id, { onDelete: "set null" }),

    // AI generation metadata
    aiModel: text("ai_model"),
    aiPromptVersion: text("ai_prompt_version"),

    // AIO (AI Optimization) fields
    aioOptimized: boolean("aio_optimized").default(false),
    aioScore: integer("aio_score"),
    entityCount: integer("entity_count").default(0),
    quotabilityScore: integer("quotability_score"),
    answerStructureScore: integer("answer_structure_score"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("content_site_idx").on(table.siteId),
    index("content_status_idx").on(table.status),
    index("content_keyword_idx").on(table.keywordId),
  ]
);

// ============================================
// PAGES (Crawled)
// ============================================

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),

    // Page data
    url: text("url").notNull(),
    path: text("path").notNull(),

    // Content extracted
    title: text("title"),
    metaDescription: text("meta_description"),
    h1: text("h1"),
    headings: jsonb("headings"),
    wordCount: integer("word_count"),

    // Links
    internalLinksOut: jsonb("internal_links_out").default([]),
    internalLinksIn: integer("internal_links_in").default(0),
    externalLinks: jsonb("external_links").default([]),

    // Technical
    statusCode: integer("status_code"),
    canonicalUrl: text("canonical_url"),
    robotsDirective: text("robots_directive"),

    // Schema
    schemaTypes: jsonb("schema_types").default([]),

    // Performance
    performanceScore: integer("performance_score"),
    lcpMs: integer("lcp_ms"),
    cls: decimal("cls", { precision: 5, scale: 4 }),

    // Indexation
    isIndexed: boolean("is_indexed"),
    indexedAt: timestamp("indexed_at"),

    // Content type
    contentType: text("content_type"),

    // Associated content
    contentId: uuid("content_id").references(() => content.id, { onDelete: "set null" }),

    // AIO (AI Optimization) Scores
    aioScore: integer("aio_score"),
    aioGoogleScore: integer("aio_google_score"),
    aioChatgptScore: integer("aio_chatgpt_score"),
    aioPerplexityScore: integer("aio_perplexity_score"),
    aioClaudeScore: integer("aio_claude_score"),
    aioGeminiScore: integer("aio_gemini_score"),
    aioLastAnalyzed: timestamp("aio_last_analyzed"),

    // AIO metadata
    entityCount: integer("entity_count").default(0),
    quotabilityScore: integer("quotability_score"),
    answerStructureScore: integer("answer_structure_score"),
    hasExpertAttribution: boolean("has_expert_attribution").default(false),

    lastCrawledAt: timestamp("last_crawled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("page_site_idx").on(table.siteId),
    index("page_url_idx").on(table.url),
  ]
);

// ============================================
// AUDITS (Site Audit Results)
// ============================================

export const audits = pgTable(
  "audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),

    // Audit type
    type: text("type").notNull().default("full"), // full, quick, aio

    // Scores
    overallScore: integer("overall_score"),
    technicalScore: integer("technical_score"),
    contentScore: integer("content_score"),
    aioScore: integer("aio_score"),

    // Counts
    pagesScanned: integer("pages_scanned").default(0),
    issuesFound: integer("issues_found").default(0),
    criticalIssues: integer("critical_issues").default(0),
    warningIssues: integer("warning_issues").default(0),
    infoIssues: integer("info_issues").default(0),

    // Duration
    durationMs: integer("duration_ms"),

    // Status
    status: text("status").default("completed"), // running, completed, failed
    error: text("error"),

    // Results snapshot
    results: jsonb("results").default({}),

    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audits_site_idx").on(table.siteId),
    index("audits_created_idx").on(table.createdAt),
  ]
);

// ============================================
// ISSUES (Technical SEO)
// ============================================

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),

    // Issue details
    type: issueTypeEnum("type").notNull(),
    severity: issueSeverityEnum("severity").notNull(),

    title: text("title").notNull(),
    description: text("description"),
    recommendation: text("recommendation"),

    // Affected element
    affectedUrl: text("affected_url"),
    affectedElement: text("affected_element"),
    currentValue: text("current_value"),
    suggestedValue: text("suggested_value"),

    // Resolution
    isResolved: boolean("is_resolved").default(false),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),

    // Auto-fix
    canAutoFix: boolean("can_auto_fix").default(false),
    autoFixApplied: boolean("auto_fix_applied").default(false),

    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("issue_site_idx").on(table.siteId),
    index("issue_severity_idx").on(table.severity),
  ]
);

// ============================================
// TASKS (Automation Queue)
// ============================================

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Task definition
    type: taskTypeEnum("type").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    // Target
    targetId: uuid("target_id"),
    targetType: text("target_type"),

    // Execution
    status: taskStatusEnum("status").default("pending"),
    priority: integer("priority").default(50),

    // Scheduling
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    // Results
    result: jsonb("result"),
    error: text("error"),

    // Retry logic
    attempts: integer("attempts").default(0),
    maxAttempts: integer("max_attempts").default(3),
    lastAttemptAt: timestamp("last_attempt_at"),

    // Source
    triggeredBy: text("triggered_by"),
    triggeredByUserId: uuid("triggered_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    // Autopilot
    isAutopilot: boolean("is_autopilot").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_site_idx").on(table.siteId),
    index("task_status_idx").on(table.status),
    index("task_scheduled_idx").on(table.scheduledFor),
  ]
);

// ============================================
// RANKINGS (Historical)
// ============================================

export const rankings = pgTable(
  "rankings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    keywordId: uuid("keyword_id").references(() => keywords.id, { onDelete: "cascade" }),
    contentId: uuid("content_id").references(() => content.id, { onDelete: "set null" }),

    keyword: text("keyword").notNull(),
    url: text("url").notNull(),

    position: decimal("position", { precision: 5, scale: 2 }),
    impressions: integer("impressions"),
    clicks: integer("clicks"),
    ctr: decimal("ctr", { precision: 5, scale: 4 }),

    date: timestamp("date").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ranking_site_date_idx").on(table.siteId, table.date),
    index("ranking_keyword_idx").on(table.keywordId),
  ]
);

// ============================================
// ENTITIES (Named entities extracted from content)
// ============================================

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),
    contentId: uuid("content_id").references(() => content.id, { onDelete: "cascade" }),

    // Entity details
    name: text("name").notNull(),
    type: text("type"), // person, organization, concept, product, location, event
    description: text("description"),

    // External references
    wikidataId: text("wikidata_id"),
    wikipediaUrl: text("wikipedia_url"),

    // Usage stats
    mentions: integer("mentions").default(1),
    contextQuality: integer("context_quality"), // 0-100

    // Timestamps
    firstSeenAt: timestamp("first_seen_at").defaultNow(),
    lastSeenAt: timestamp("last_seen_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("entities_site_idx").on(table.siteId),
    index("entities_page_idx").on(table.pageId),
    index("entities_content_idx").on(table.contentId),
    index("entities_type_idx").on(table.type),
  ]
);

// ============================================
// AI CITATIONS (Track when AI platforms cite our content)
// ============================================

export const aiCitations = pgTable(
  "ai_citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }),

    // Which platform cited us
    platform: text("platform").notNull(), // google_aio, chatgpt, perplexity, claude, gemini

    // The query that resulted in citation
    query: text("query").notNull(),

    // Citation details
    citationType: text("citation_type"), // direct_quote, paraphrase, source_link, featured
    snippet: text("snippet"),
    position: integer("position"), // Position in AI response

    // Confidence
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),

    // Discovery metadata
    discoveredAt: timestamp("discovered_at").defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at"),
  },
  (table) => [
    index("ai_citations_site_idx").on(table.siteId),
    index("ai_citations_platform_idx").on(table.platform),
    index("ai_citations_page_idx").on(table.pageId),
    uniqueIndex("ai_citations_unique_idx").on(table.siteId, table.platform, table.query, table.pageId),
  ]
);

// ============================================
// AIO ANALYSES (Detailed AIO analysis results)
// ============================================

export const aioAnalyses = pgTable(
  "aio_analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .references(() => sites.id, { onDelete: "cascade" })
      .notNull(),
    pageId: uuid("page_id")
      .references(() => pages.id, { onDelete: "cascade" })
      .notNull(),

    // Analysis version
    version: integer("version").default(1),

    // Platform scores (0-100)
    googleAioScore: integer("google_aio_score"),
    chatgptScore: integer("chatgpt_score"),
    perplexityScore: integer("perplexity_score"),
    claudeScore: integer("claude_score"),
    geminiScore: integer("gemini_score"),
    combinedScore: integer("combined_score"),

    // Breakdown scores
    entityDensityScore: integer("entity_density_score"),
    quotabilityScore: integer("quotability_score"),
    answerStructureScore: integer("answer_structure_score"),
    schemaPresenceScore: integer("schema_presence_score"),
    freshnessScore: integer("freshness_score"),
    authorityScore: integer("authority_score"),

    // Extracted data
    entitiesFound: jsonb("entities_found").default([]),
    quotableSnippets: jsonb("quotable_snippets").default([]),
    missingElements: jsonb("missing_elements").default([]),
    improvementSuggestions: jsonb("improvement_suggestions").default([]),

    // Platform-specific recommendations
    googleRecommendations: jsonb("google_recommendations").default([]),
    chatgptRecommendations: jsonb("chatgpt_recommendations").default([]),
    perplexityRecommendations: jsonb("perplexity_recommendations").default([]),

    // Analysis metadata
    modelUsed: text("model_used").default("claude-sonnet-4-20250514"),
    tokensUsed: integer("tokens_used"),
    analysisDurationMs: integer("analysis_duration_ms"),

    analyzedAt: timestamp("analyzed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("aio_analyses_page_idx").on(table.pageId),
    index("aio_analyses_site_idx").on(table.siteId),
    index("aio_analyses_analyzed_idx").on(table.analyzedAt),
  ]
);

// ============================================
// RELATIONS
// ============================================

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  users: many(users),
  sites: many(sites),
  usageRecords: many(usageRecords),
  tasks: many(tasks),
  integrations: many(integrations),
  creditBalance: one(creditBalance),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  sessions: many(sessions),
  assignedContent: many(content),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  keywords: many(keywords),
  keywordClusters: many(keywordClusters),
  content: many(content),
  pages: many(pages),
  issues: many(issues),
  tasks: many(tasks),
  rankings: many(rankings),
  entities: many(entities),
  aiCitations: many(aiCitations),
  aioAnalyses: many(aioAnalyses),
  audits: many(audits),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [integrations.organizationId],
    references: [organizations.id],
  }),
}));

export const creditBalanceRelations = relations(creditBalance, ({ one }) => ({
  organization: one(organizations, {
    fields: [creditBalance.organizationId],
    references: [organizations.id],
  }),
}));

export const auditsRelations = relations(audits, ({ one }) => ({
  site: one(sites, {
    fields: [audits.siteId],
    references: [sites.id],
  }),
}));

export const usageRelations = relations(usage, ({ one }) => ({
  organization: one(organizations, {
    fields: [usage.organizationId],
    references: [organizations.id],
  }),
}));

export const contentIdeasRelations = relations(contentIdeas, ({ one }) => ({
  site: one(sites, {
    fields: [contentIdeas.siteId],
    references: [sites.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  site: one(sites, {
    fields: [keywords.siteId],
    references: [sites.id],
  }),
  cluster: one(keywordClusters, {
    fields: [keywords.clusterId],
    references: [keywordClusters.id],
  }),
  content: one(content, {
    fields: [keywords.contentId],
    references: [content.id],
  }),
  rankings: many(rankings),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  site: one(sites, {
    fields: [content.siteId],
    references: [sites.id],
  }),
  keyword: one(keywords, {
    fields: [content.keywordId],
    references: [keywords.id],
  }),
  cluster: one(keywordClusters, {
    fields: [content.clusterId],
    references: [keywordClusters.id],
  }),
  assignedUser: one(users, {
    fields: [content.assignedTo],
    references: [users.id],
  }),
  entities: many(entities),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  site: one(sites, {
    fields: [pages.siteId],
    references: [sites.id],
  }),
  content: one(content, {
    fields: [pages.contentId],
    references: [content.id],
  }),
  entities: many(entities),
  aiCitations: many(aiCitations),
  aioAnalyses: many(aioAnalyses),
  issues: many(issues),
}));

export const entitiesRelations = relations(entities, ({ one }) => ({
  site: one(sites, {
    fields: [entities.siteId],
    references: [sites.id],
  }),
  page: one(pages, {
    fields: [entities.pageId],
    references: [pages.id],
  }),
  content: one(content, {
    fields: [entities.contentId],
    references: [content.id],
  }),
}));

export const aiCitationsRelations = relations(aiCitations, ({ one }) => ({
  site: one(sites, {
    fields: [aiCitations.siteId],
    references: [sites.id],
  }),
  page: one(pages, {
    fields: [aiCitations.pageId],
    references: [pages.id],
  }),
}));

export const aioAnalysesRelations = relations(aioAnalyses, ({ one }) => ({
  site: one(sites, {
    fields: [aioAnalyses.siteId],
    references: [sites.id],
  }),
  page: one(pages, {
    fields: [aioAnalyses.pageId],
    references: [pages.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Keyword = typeof keywords.$inferSelect;
export type NewKeyword = typeof keywords.$inferInsert;
export type KeywordCluster = typeof keywordClusters.$inferSelect;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Ranking = typeof rankings.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type AICitation = typeof aiCitations.$inferSelect;
export type NewAICitation = typeof aiCitations.$inferInsert;
export type AIOAnalysis = typeof aioAnalyses.$inferSelect;
export type NewAIOAnalysis = typeof aioAnalyses.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type CreditBalance = typeof creditBalance.$inferSelect;
export type NewCreditBalance = typeof creditBalance.$inferInsert;
export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
export type ContentIdea = typeof contentIdeas.$inferSelect;
export type NewContentIdea = typeof contentIdeas.$inferInsert;

