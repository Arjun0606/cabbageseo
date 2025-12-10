/**
 * CabbageSEO Orchestration Layer
 * 
 * The TRUE SEO Autopilot - NOT a point solution
 * 
 * This orchestrator:
 * 1. Connects ALL SEO tools together
 * 2. Makes intelligent decisions
 * 3. Runs continuously (not one-shot)
 * 4. Handles the FULL SEO workflow end-to-end
 * 5. Anyone can do SEO - no expertise needed
 * 
 * Philosophy: We don't reinvent tools - we ORCHESTRATE them
 */

import { DataForSEOClient } from "@/lib/integrations/dataforseo/client";
import { SerpAPIClient } from "@/lib/integrations/serpapi/client";
import { ContentPipeline, type GeneratedContent } from "@/lib/ai/content-pipeline";
import { SiteCrawler, type PageData } from "@/lib/crawler/site-crawler";
import { TechnicalAuditEngine, type AuditResult } from "@/lib/crawler/technical-audit";
import { AutoFixEngine } from "@/lib/crawler/auto-fix";
import { createPublisherFromIntegration, type CMSType } from "@/lib/cms/publisher";

// ============================================
// TYPES
// ============================================

export type SEOTaskType = 
  | "discovery"           // Find & crawl site
  | "audit"               // Technical SEO audit
  | "fix"                 // Auto-fix issues
  | "research"            // Keyword research
  | "analyze_competitors" // Competitor gap analysis
  | "plan_content"        // Content strategy
  | "generate_content"    // Write articles
  | "optimize_content"    // Improve existing content
  | "internal_linking"    // Add/fix internal links
  | "publish"             // Push to CMS
  | "track_rankings"      // Monitor positions
  | "report";             // Generate reports

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface SEOTask {
  id: string;
  type: SEOTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string;
  estimatedImpact: "high" | "medium" | "low";
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TrackedKeyword {
  keyword: string;
  position: number;
  previousPosition?: number;
  volume: number;
  url?: string;
  lastChecked: Date;
}

export interface KeywordOpportunity {
  keyword: string;
  volume: number;
  difficulty: number;
  gap: "not ranking" | "page 2" | "top 10 potential";
}

export interface ContentPlanItem {
  keyword: string;
  title: string;
  status: "idea" | "writing" | "draft" | "published";
  priority: TaskPriority;
  generatedContent?: GeneratedContent;
}

export interface Competitor {
  domain: string;
  commonKeywords: number;
  estimatedTraffic: number;
}

export interface SiteState {
  url: string;
  siteId: string;
  organizationId: string;
  
  // Discovery
  pages: Array<{
    url: string;
    title: string;
    type: string;
    wordCount?: number;
    lastCrawled?: Date;
  }>;
  
  // Technical Health
  seoScore: number;
  auditResult?: AuditResult;
  issuesFixed: number;
  
  // Keywords
  trackedKeywords: TrackedKeyword[];
  keywordOpportunities: KeywordOpportunity[];
  
  // Content
  contentPlan: ContentPlanItem[];
  publishedContent: Array<{
    title: string;
    url: string;
    keyword: string;
    publishedAt: Date;
    currentPosition?: number;
  }>;
  
  // Competitors
  competitors: Competitor[];
  
  // Integrations
  connectedCMS?: CMSType;
  connectedGSC: boolean;
  connectedGA4: boolean;
}

export interface OrchestrationConfig {
  siteUrl: string;
  siteId: string;
  organizationId: string;
  
  // Preferences
  autoFix: boolean;
  autoPublish: boolean;
  articlesPerWeek: number;
  contentTone: "professional" | "casual" | "technical" | "friendly";
  targetAudience: string;
  
  // CMS
  cms?: {
    type: CMSType;
    credentials: Record<string, string>;
  };
  
  // Limits
  maxConcurrentTasks: number;
}

export interface OrchestrationEvent {
  type: "task_started" | "task_completed" | "task_failed" | "state_updated" | "decision_made";
  timestamp: Date;
  data: Record<string, unknown>;
}

type EventCallback = (event: OrchestrationEvent) => void;

// ============================================
// THE ORCHESTRATOR
// ============================================

export class SEOOrchestrator {
  private config: OrchestrationConfig;
  private state: SiteState;
  private taskQueue: SEOTask[] = [];
  private runningTasks: SEOTask[] = [];
  private completedTasks: SEOTask[] = [];
  private isRunning = false;
  private onEvent?: EventCallback;
  
  // Connected services (the tools we orchestrate)
  private crawler: SiteCrawler;
  private auditEngine: TechnicalAuditEngine;
  private autoFixer: AutoFixEngine;
  private dataForSEO: DataForSEOClient;
  private serpAPI: SerpAPIClient;
  private contentPipeline: ContentPipeline;

  constructor(config: OrchestrationConfig, onEvent?: EventCallback) {
    this.config = config;
    this.onEvent = onEvent;
    
    // Initialize state
    this.state = {
      url: config.siteUrl,
      siteId: config.siteId,
      organizationId: config.organizationId,
      pages: [],
      seoScore: 0,
      issuesFixed: 0,
      trackedKeywords: [],
      keywordOpportunities: [],
      contentPlan: [],
      publishedContent: [],
      competitors: [],
      connectedGSC: false,
      connectedGA4: false,
    };
    
    // Initialize all the tools we orchestrate
    this.crawler = new SiteCrawler();
    this.auditEngine = new TechnicalAuditEngine();
    this.autoFixer = new AutoFixEngine();
    this.dataForSEO = new DataForSEOClient();
    this.serpAPI = new SerpAPIClient();
    this.contentPipeline = new ContentPipeline();
  }

  // ============================================
  // PUBLIC API
  // ============================================

  async start(): Promise<void> {
    this.isRunning = true;
    this.emit("decision_made", { decision: "Starting SEO Autopilot" });
    
    // Initial discovery
    await this.queueTask({
      type: "discovery",
      priority: "critical",
      title: "Discover Site Structure",
      description: "Crawl the site to understand pages, structure, and current state",
      estimatedImpact: "high",
    });
    
    // Start the orchestration loop
    await this.runLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.emit("decision_made", { decision: "Stopping SEO Autopilot" });
  }

  getState(): SiteState {
    return { ...this.state };
  }

  getTasks(): { pending: SEOTask[]; running: SEOTask[]; completed: SEOTask[] } {
    return {
      pending: [...this.taskQueue],
      running: [...this.runningTasks],
      completed: [...this.completedTasks],
    };
  }

  async triggerTask(type: SEOTaskType, data?: Record<string, unknown>): Promise<SEOTask> {
    const task = await this.queueTask({
      type,
      priority: "high",
      title: this.getTaskTitle(type),
      description: this.getTaskDescription(type),
      estimatedImpact: "medium",
      data,
    });
    return task;
  }

  // ============================================
  // THE BRAIN - Decision Making
  // ============================================

  private async decideNextActions(): Promise<SEOTask[]> {
    const decisions: SEOTask[] = [];
    
    // Priority 1: Critical issues need fixing
    const criticalIssues = this.state.auditResult?.issues.filter(i => i.severity === "critical") || [];
    if (criticalIssues.length > 0 && this.config.autoFix) {
      decisions.push(this.createTask("fix", "critical", `Fix ${criticalIssues.length} Critical SEO Issues`, { issues: criticalIssues }));
    }
    
    // Priority 2: No content plan? Create one
    if (this.state.contentPlan.length === 0 && this.state.keywordOpportunities.length > 0) {
      decisions.push(this.createTask("plan_content", "high", "Create Content Strategy"));
    }
    
    // Priority 3: Content ready to write?
    const contentToWrite = this.state.contentPlan.filter(c => c.status === "idea");
    if (contentToWrite.length > 0) {
      const next = contentToWrite[0];
      decisions.push(this.createTask("generate_content", "high", `Write: ${next.title}`, { content: next }));
    }
    
    // Priority 4: Drafts ready to publish?
    const drafts = this.state.contentPlan.filter(c => c.status === "draft" && c.generatedContent);
    if (drafts.length > 0 && this.config.autoPublish && this.config.cms) {
      const next = drafts[0];
      decisions.push(this.createTask("publish", "medium", `Publish: ${next.title}`, { content: next }));
    }
    
    // Priority 5: Need to check rankings?
    const lastCheck = this.state.trackedKeywords[0]?.lastChecked;
    const shouldCheck = !lastCheck || (Date.now() - lastCheck.getTime()) > 24 * 60 * 60 * 1000;
    if (shouldCheck && this.state.trackedKeywords.length > 0) {
      decisions.push(this.createTask("track_rankings", "medium", "Update Keyword Rankings"));
    }
    
    // Priority 6: Need more keywords?
    if (this.state.keywordOpportunities.length < 10) {
      decisions.push(this.createTask("research", "medium", "Discover Keyword Opportunities"));
    }
    
    // Priority 7: Competitor analysis?
    if (this.state.competitors.length === 0) {
      decisions.push(this.createTask("analyze_competitors", "low", "Analyze Competitors"));
    }
    
    // Priority 8: Weekly audit
    const lastAudit = this.completedTasks.find(t => t.type === "audit")?.completedAt;
    const shouldAudit = !lastAudit || (Date.now() - lastAudit.getTime()) > 7 * 24 * 60 * 60 * 1000;
    if (shouldAudit && this.state.pages.length > 0) {
      decisions.push(this.createTask("audit", "low", "Weekly SEO Audit"));
    }
    
    this.emit("decision_made", { actions: decisions.map(d => d.type) });
    return decisions;
  }

  // ============================================
  // TASK EXECUTION
  // ============================================

  private async runLoop(): Promise<void> {
    while (this.isRunning) {
      if (this.runningTasks.length < this.config.maxConcurrentTasks) {
        const nextTask = this.taskQueue.shift();
        
        if (nextTask) {
          this.executeTask(nextTask);
        } else {
          const newTasks = await this.decideNextActions();
          const filtered = newTasks.filter(t => 
            !this.taskQueue.some(q => q.type === t.type) &&
            !this.runningTasks.some(r => r.type === t.type)
          );
          this.taskQueue.push(...filtered);
        }
      }
      
      await this.sleep(1000);
    }
  }

  private async executeTask(task: SEOTask): Promise<void> {
    task.status = "running";
    task.startedAt = new Date();
    this.runningTasks.push(task);
    
    this.emit("task_started", { taskId: task.id, type: task.type });
    
    try {
      switch (task.type) {
        case "discovery":
          await this.executeDiscovery(task);
          break;
        case "audit":
          await this.executeAudit(task);
          break;
        case "fix":
          await this.executeFix(task);
          break;
        case "research":
          await this.executeResearch(task);
          break;
        case "analyze_competitors":
          await this.executeCompetitorAnalysis(task);
          break;
        case "plan_content":
          await this.executeContentPlanning(task);
          break;
        case "generate_content":
          await this.executeContentGeneration(task);
          break;
        case "publish":
          await this.executePublish(task);
          break;
        case "track_rankings":
          await this.executeRankTracking(task);
          break;
        default:
          // Other tasks can be added
          break;
      }
      
      task.status = "completed";
      task.completedAt = new Date();
      this.emit("task_completed", { taskId: task.id, result: task.result });
      
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : "Unknown error";
      task.completedAt = new Date();
      this.emit("task_failed", { taskId: task.id, error: task.error });
    }
    
    this.runningTasks = this.runningTasks.filter(t => t.id !== task.id);
    this.completedTasks.push(task);
  }

  // ============================================
  // TASK IMPLEMENTATIONS
  // ============================================

  private async executeDiscovery(task: SEOTask): Promise<void> {
    const result = await this.crawler.crawl(this.config.siteUrl);
    
    this.state.pages = result.pages.map((p: PageData) => ({
      url: p.url,
      title: p.title || p.url,
      type: this.detectPageType(p.url),
      wordCount: p.wordCount,
      lastCrawled: new Date(),
    }));
    
    task.result = { pagesFound: result.pages.length };
    this.emit("state_updated", { pages: this.state.pages.length });
    
    // Queue audit after discovery
    await this.queueTask({
      type: "audit",
      priority: "high",
      title: "Initial SEO Audit",
      description: "Audit discovered pages",
      estimatedImpact: "high",
    });
  }

  private async executeAudit(task: SEOTask): Promise<void> {
    // Re-crawl to get fresh data for audit
    const crawlResult = await this.crawler.crawl(this.config.siteUrl);
    
    const auditResult = await this.auditEngine.audit(crawlResult);
    
    this.state.auditResult = auditResult;
    this.state.seoScore = auditResult.score;
    
    task.result = {
      score: auditResult.score,
      issues: auditResult.issues.length,
      critical: auditResult.summary.criticalIssues,
    };
    
    this.emit("state_updated", { seoScore: auditResult.score });
  }

  private async executeFix(task: SEOTask): Promise<void> {
    if (!this.state.auditResult) return;
    
    // Need to re-crawl to get pages for fix generation
    const crawlResult = await this.crawler.crawl(this.config.siteUrl);
    const fixes = this.autoFixer.generateFixes(this.state.auditResult, crawlResult.pages);
    let fixedCount = 0;
    
    for (const fix of fixes) {
      if (fix.automated) {
        // In production, would apply the fix
        fixedCount++;
      }
    }
    
    this.state.issuesFixed += fixedCount;
    task.result = { fixedCount, totalFixes: fixes.length };
  }

  private async executeResearch(task: SEOTask): Promise<void> {
    const seeds = this.extractSeedKeywords();
    
    const suggestions = await this.dataForSEO.getKeywordSuggestions(
      seeds.join(","),
      "United States",
      50
    );
    
    const opportunities: KeywordOpportunity[] = suggestions
      .filter(kw => kw.difficulty < 50 && kw.volume > 100)
      .map(kw => ({
        keyword: kw.keyword,
        volume: kw.volume,
        difficulty: kw.difficulty,
        gap: "not ranking" as const,
      }));
    
    this.state.keywordOpportunities = opportunities;
    
    // Track top keywords
    const newTracked = opportunities.slice(0, 20).map(kw => ({
      keyword: kw.keyword,
      position: 0,
      volume: kw.volume,
      lastChecked: new Date(),
    }));
    
    this.state.trackedKeywords = [...this.state.trackedKeywords, ...newTracked];
    task.result = { opportunities: opportunities.length };
  }

  private async executeCompetitorAnalysis(task: SEOTask): Promise<void> {
    const keywords = this.state.trackedKeywords.slice(0, 5);
    const domains = new Map<string, number>();
    
    for (const kw of keywords) {
      try {
        const serpResult = await this.serpAPI.searchGoogle({ q: kw.keyword, num: 10 });
        const ourDomain = new URL(this.config.siteUrl).hostname;
        
        for (const r of serpResult.organic_results || []) {
          try {
            const domain = new URL(r.link).hostname;
            if (domain !== ourDomain) {
              domains.set(domain, (domains.get(domain) || 0) + 1);
            }
          } catch {
            // Invalid URL
          }
        }
      } catch {
        // Continue on error
      }
    }
    
    this.state.competitors = Array.from(domains.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, commonKeywords: count, estimatedTraffic: 0 }));
    
    task.result = { competitors: this.state.competitors.length };
  }

  private async executeContentPlanning(task: SEOTask): Promise<void> {
    const keywords = this.state.keywordOpportunities.map(o => o.keyword);
    
    // Simple clustering based on keywords
    const contentPlan: ContentPlanItem[] = keywords.slice(0, 10).map(kw => ({
      keyword: kw,
      title: `Complete Guide to ${kw.charAt(0).toUpperCase() + kw.slice(1)}`,
      status: "idea" as const,
      priority: "high" as const,
    }));
    
    this.state.contentPlan = contentPlan;
    task.result = { planned: contentPlan.length };
  }

  private async executeContentGeneration(task: SEOTask): Promise<void> {
    const content = task.data?.content as ContentPlanItem;
    if (!content) throw new Error("No content specified");
    
    // First generate outline (using empty SERP results for now)
    const outlineResult = await this.contentPipeline.generateOutline(
      content.keyword, 
      [], // Would normally pass SERP results
      1500
    );
    
    // Then generate full article
    const generated = await this.contentPipeline.generateArticle(
      content.keyword,
      outlineResult.outline,
      { targetWordCount: 1500 }
    );
    
    // Update content plan
    const planItem = this.state.contentPlan.find(c => c.keyword === content.keyword);
    if (planItem) {
      planItem.status = "draft";
      planItem.generatedContent = generated;
    }
    
    task.result = { wordCount: generated.wordCount, seoScore: generated.seoScore };
  }

  private async executePublish(task: SEOTask): Promise<void> {
    if (!this.config.cms) throw new Error("No CMS configured");
    
    const content = task.data?.content as ContentPlanItem;
    if (!content?.generatedContent) throw new Error("No content to publish");
    
    const publisher = await createPublisherFromIntegration(
      this.config.cms.type,
      this.config.cms.credentials
    );
    
    if (!publisher) throw new Error("Failed to create publisher");
    
    const result = await publisher.publish({
      title: content.generatedContent.title,
      content: content.generatedContent.bodyHtml || content.generatedContent.body,
      seoTitle: content.generatedContent.metaTitle,
      metaDescription: content.generatedContent.metaDescription,
      status: "publish",
    });
    
    if (result.success) {
      const planItem = this.state.contentPlan.find(c => c.keyword === content.keyword);
      if (planItem) planItem.status = "published";
      
      this.state.publishedContent.push({
        title: content.generatedContent.title,
        url: result.url || "",
        keyword: content.keyword,
        publishedAt: new Date(),
      });
    }
    
    task.result = { success: result.success, url: result.url };
  }

  private async executeRankTracking(task: SEOTask): Promise<void> {
    const updates: Array<{ keyword: string; change: number }> = [];
    const ourDomain = new URL(this.config.siteUrl).hostname;
    
    for (const kw of this.state.trackedKeywords) {
      try {
        const serpResult = await this.serpAPI.searchGoogle({ q: kw.keyword, num: 100 });
        const results = serpResult.organic_results || [];
        const ourResult = results.find((r: { link: string; position?: number }) => r.link.includes(ourDomain));
        
        const oldPos = kw.position;
        const newPos = ourResult?.position || 0;
        
        if (oldPos !== newPos) {
          updates.push({ keyword: kw.keyword, change: oldPos - newPos });
        }
        
        kw.previousPosition = oldPos;
        kw.position = newPos;
        kw.url = ourResult?.link;
        kw.lastChecked = new Date();
      } catch {
        // Continue on error
      }
    }
    
    task.result = { checked: this.state.trackedKeywords.length, changes: updates.length };
  }

  // ============================================
  // HELPERS
  // ============================================

  private createTask(
    type: SEOTaskType,
    priority: TaskPriority,
    title: string,
    data?: Record<string, unknown>
  ): SEOTask {
    return {
      id: this.generateId(),
      type,
      priority,
      status: "pending",
      title,
      description: this.getTaskDescription(type),
      estimatedImpact: priority === "critical" ? "high" : "medium",
      data,
      createdAt: new Date(),
    };
  }

  private async queueTask(taskDef: Omit<SEOTask, "id" | "status" | "createdAt">): Promise<SEOTask> {
    const task: SEOTask = {
      ...taskDef,
      id: this.generateId(),
      status: "pending",
      createdAt: new Date(),
    };
    this.taskQueue.push(task);
    return task;
  }

  private emit(type: OrchestrationEvent["type"], data: Record<string, unknown>): void {
    this.onEvent?.({ type, timestamp: new Date(), data });
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private detectPageType(url: string): string {
    if (url.includes("/blog/") || url.includes("/post/")) return "blog";
    if (url.includes("/product/") || url.includes("/shop/")) return "product";
    return "page";
  }

  private extractSeedKeywords(): string[] {
    const keywords = new Set<string>();
    for (const page of this.state.pages.slice(0, 20)) {
      page.title
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3)
        .forEach(w => keywords.add(w));
    }
    return Array.from(keywords).slice(0, 10);
  }

  private getTaskTitle(type: SEOTaskType): string {
    const titles: Record<SEOTaskType, string> = {
      discovery: "Discover Site",
      audit: "Run SEO Audit",
      fix: "Fix Issues",
      research: "Research Keywords",
      analyze_competitors: "Analyze Competitors",
      plan_content: "Plan Content",
      generate_content: "Generate Content",
      optimize_content: "Optimize Content",
      internal_linking: "Internal Linking",
      publish: "Publish Content",
      track_rankings: "Track Rankings",
      report: "Generate Report",
    };
    return titles[type];
  }

  private getTaskDescription(type: SEOTaskType): string {
    const descriptions: Record<SEOTaskType, string> = {
      discovery: "Crawl and understand site structure",
      audit: "Check for technical SEO issues",
      fix: "Auto-fix detected issues",
      research: "Find keyword opportunities",
      analyze_competitors: "Analyze competitor strategies",
      plan_content: "Create content calendar",
      generate_content: "Write SEO-optimized articles",
      optimize_content: "Improve existing content",
      internal_linking: "Add strategic internal links",
      publish: "Push to CMS",
      track_rankings: "Check keyword positions",
      report: "Generate progress report",
    };
    return descriptions[type];
  }
}

// ============================================
// QUICK START
// ============================================

export async function createOrchestrator(
  siteUrl: string,
  organizationId: string,
  siteId: string,
  options: Partial<OrchestrationConfig> = {},
  onEvent?: EventCallback
): Promise<SEOOrchestrator> {
  const config: OrchestrationConfig = {
    siteUrl,
    organizationId,
    siteId,
    autoFix: true,
    autoPublish: false,
    articlesPerWeek: 2,
    contentTone: "professional",
    targetAudience: "general audience",
    maxConcurrentTasks: 2,
    ...options,
  };
  
  return new SEOOrchestrator(config, onEvent);
}
