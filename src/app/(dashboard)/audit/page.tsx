"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSite } from "@/contexts/site-context";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Download,
  Zap,
  FileText,
  Image,
  Link2,
  Code,
  Gauge,
  Filter,
  Loader2,
  AlertCircle,
  Globe,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

type IssueSeverity = "critical" | "warning" | "info" | "passed";
type IssueCategory = "meta" | "content" | "images" | "links" | "technical" | "performance";

interface AuditIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedUrl?: string;
  currentValue?: string;
  suggestedValue?: string;
  canAutoFix: boolean;
}

interface AuditData {
  score: number;
  issues: AuditIssue[];
  stats: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    passed: number;
  };
  categories: Array<{
    category: IssueCategory;
    label: string;
    critical: number;
    warning: number;
    passed: number;
  }>;
  lastScan: string | null;
}

// ============================================
// SEVERITY CONFIG
// ============================================

const severityConfig = {
  critical: { label: "Critical", color: "text-red-500", bgColor: "bg-red-500/10", icon: XCircle },
  warning: { label: "Warning", color: "text-yellow-500", bgColor: "bg-yellow-500/10", icon: AlertTriangle },
  info: { label: "Info", color: "text-blue-500", bgColor: "bg-blue-500/10", icon: Info },
  passed: { label: "Passed", color: "text-green-500", bgColor: "bg-green-500/10", icon: CheckCircle2 },
};

const categoryIcons: Record<IssueCategory, React.ElementType> = {
  meta: FileText,
  content: FileText,
  images: Image,
  links: Link2,
  technical: Code,
  performance: Gauge,
};

// ============================================
// SCORE RING
// ============================================

function ScoreRing({ score, isLoading }: { score: number; isLoading?: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

  if (isLoading) {
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/20"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getColor(score)} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

// ============================================
// ISSUE CARD
// ============================================

function IssueCard({
  issue,
  selected,
  onSelect,
  onFix,
  isFixing,
}: {
  issue: AuditIssue;
  selected: boolean;
  onSelect: () => void;
  onFix: () => void;
  isFixing?: boolean;
}) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        selected ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{issue.title}</h4>
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
          {issue.affectedUrl && (
            <p className="text-xs text-muted-foreground">
              Affected: <span className="font-mono">{issue.affectedUrl}</span>
            </p>
          )}
          {issue.currentValue && (
            <div className="mt-2 space-y-1">
              <p className="text-xs">
                <span className="text-muted-foreground">Current:</span>{" "}
                <span className="font-mono text-red-500 line-through">{issue.currentValue}</span>
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">Suggested:</span>{" "}
                <span className="font-mono text-green-500">{issue.suggestedValue}</span>
              </p>
            </div>
          )}
        </div>
        {issue.canAutoFix && (
          <Button size="sm" variant="outline" onClick={onFix} disabled={isFixing}>
            {isFixing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1" />
                Auto-Fix
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ hasSite, siteDomain, siteScore, isAutoRunning, onRunAudit }: { 
  hasSite: boolean; 
  siteDomain?: string;
  siteScore?: number;
  isAutoRunning?: boolean;
  onRunAudit?: () => void;
}) {
  // If site has a score from previous analysis, show summary
  if (hasSite && siteScore && siteScore > 0 && !isAutoRunning) {
    const getScoreColor = (score: number) => {
      if (score >= 80) return "text-green-500";
      if (score >= 60) return "text-yellow-500";
      return "text-red-500";
    };
    
    return (
      <Card className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-emerald-500/20">
            <span className={`text-3xl font-bold ${getScoreColor(siteScore)}`}>{siteScore}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {siteDomain} Analysis Complete
          </h3>
          <p className="text-muted-foreground mb-6">
            Your site scored <span className={`font-semibold ${getScoreColor(siteScore)}`}>{siteScore}/100</span>.
            Run a detailed audit to see specific issues and recommendations.
          </p>
          <Button onClick={onRunAudit}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Detailed Audit
          </Button>
        </div>
      </Card>
    );
  }

  if (hasSite) {
    // Show analyzing state - audit auto-runs, no manual trigger needed
    return (
      <Card className="p-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isAutoRunning ? "Analyzing Your Site..." : "Preparing Audit..."}
          </h3>
          <p className="text-muted-foreground mb-4">
            Scanning <span className="font-medium text-white">{siteDomain}</span> for SEO issues.
            This usually takes 15-30 seconds.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Crawling pages and analyzing content...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Site Selected</h3>
        <p className="text-muted-foreground mb-6">
          Add a site to run technical audits and identify SEO issues.
        </p>
        <Link href="/sites/new">
          <Button>Add Your First Site</Button>
        </Link>
      </div>
    </Card>
  );
}

// ============================================
// LOADING STATE
// ============================================

function AuditLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <ScoreRing score={0} isLoading />
            <Skeleton className="h-4 w-24 mt-4" />
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AuditPage() {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | "all">("all");
  const [fixingIssue, setFixingIssue] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const hasAutoRun = useRef(false);
  const queryClient = useQueryClient();
  const { selectedSite, isLoading: siteLoading } = useSite();

  // Fetch audit data for selected site
  const { data, isLoading, error, refetch } = useQuery<AuditData>({
    queryKey: ["audit", selectedSite?.id],
    queryFn: async () => {
      if (!selectedSite?.id) return null;
      const response = await fetch(`/api/audit/issues?siteId=${selectedSite.id}`);
      if (!response.ok) throw new Error("Failed to fetch audit data");
      const json = await response.json();
      return json.data;
    },
    enabled: !!selectedSite?.id,
  });

  // Run new scan mutation with timeout handling
  const scanMutation = useMutation({
    mutationFn: async () => {
      // Ensure we have a full URL with protocol
      const domain = selectedSite?.domain || "";
      const url = domain.startsWith("http") ? domain : `https://${domain}`;
      
      // Use AbortController for timeout (90 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      try {
        const response = await fetch("/api/onboarding/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to analyze site");
        }
        return response.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
          // On timeout, still try to refetch - analysis might have saved partial data
          await refetch();
          throw new Error("Analysis is taking longer than expected. Refreshing to check for results...");
        }
        throw err;
      }
    },
    onSuccess: () => {
      setIsAutoRunning(false);
      // Refresh immediately after scan completes
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      refetch();
    },
    onError: (error) => {
      setIsAutoRunning(false);
      console.error("Scan error:", error);
      // Still try to refetch in case partial data was saved
      refetch();
    },
  });

  // Check if we have meaningful data (issues exist or stats show we've analyzed)
  const hasData = data && (
    data.issues?.length > 0 || 
    (data.stats?.total ?? 0) > 0 ||
    (data.stats?.critical ?? 0) > 0 ||
    (data.stats?.warning ?? 0) > 0
  );
  
  // Site already has a score (from command palette analysis)
  const siteHasScore = selectedSite?.seoScore && selectedSite.seoScore > 0;
  
  // If site has score and no data, it means issues were saved during onboarding
  // We should display them, not ask to run audit again

  // AUTO-RUN: If we have a site but no meaningful data AND no existing score, automatically start the audit
  // If the site already has a score, don't auto-run (the analysis was already done)
  useEffect(() => {
    if (
      selectedSite?.id &&
      !isLoading &&
      !siteLoading &&
      !hasData &&
      !siteHasScore &&
      !error &&
      !scanMutation.isPending &&
      !hasAutoRun.current
    ) {
      hasAutoRun.current = true;
      setIsAutoRunning(true);
      scanMutation.mutate();
    }
  }, [selectedSite?.id, isLoading, siteLoading, hasData, siteHasScore, error, scanMutation]);

  // Fix issue mutation
  const fixMutation = useMutation({
    mutationFn: async (issueId: string) => {
      setFixingIssue(issueId);
      const response = await fetch("/api/audit/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: issueId, action: "fix" }),
      });
      if (!response.ok) throw new Error("Failed to fix issue");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      setFixingIssue(null);
    },
    onError: () => {
      setFixingIssue(null);
    },
  });

  const filteredIssues =
    filterSeverity === "all"
      ? (data?.issues || [])
      : (data?.issues || []).filter((i) => i.severity === filterSeverity);

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkFix = async () => {
    for (const id of selectedIssues) {
      const issue = data?.issues.find((i) => i.id === id);
      if (issue?.canAutoFix) {
        await fixMutation.mutateAsync(id);
      }
    }
    setSelectedIssues([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Technical Audit</h1>
          <p className="text-muted-foreground">
            Find and fix SEO issues on your website
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!hasData || !selectedSite}
            onClick={async () => {
              if (!selectedSite?.id) return;
              try {
                const response = await fetch(`/api/export/report?siteId=${selectedSite.id}&type=seo`);
                const result = await response.json();
                if (result.success) {
                  // Create and download the file
                  const blob = new Blob([result.data.markdown], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = result.data.filename;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              } catch (e) {
                console.error("Export failed:", e);
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending}>
            {scanMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {scanMutation.isPending ? "Scanning..." : "Run New Audit"}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load audit data</p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && <AuditLoading />}

      {/* Empty State - Shows analyzing state (auto-runs) or score summary if already analyzed */}
      {!isLoading && !siteLoading && !error && !hasData && (
        <EmptyState 
          hasSite={!!selectedSite} 
          siteDomain={selectedSite?.domain}
          siteScore={selectedSite?.seoScore ?? undefined}
          isAutoRunning={isAutoRunning || scanMutation.isPending}
          onRunAudit={() => scanMutation.mutate()}
        />
      )}

      {/* Data View */}
      {!isLoading && hasData && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center">
                <ScoreRing score={data?.score || 0} />
                <p className="mt-4 text-sm font-medium">SEO Health Score</p>
                {data?.lastScan && (
                  <p className="text-xs text-muted-foreground">
                    Last scanned: {new Date(data.lastScan).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Issues Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-red-500/10">
                    <p className="text-3xl font-bold text-red-500">{data?.stats.critical || 0}</p>
                    <p className="text-sm text-muted-foreground">Critical Issues</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                    <p className="text-3xl font-bold text-yellow-500">{data?.stats.warning || 0}</p>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-500/10">
                    <p className="text-3xl font-bold text-green-500">{data?.stats.passed || 0}</p>
                    <p className="text-sm text-muted-foreground">Passed Checks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AIO Visibility Card */}
          <Card className="bg-gradient-to-r from-violet-500/10 via-blue-500/5 to-transparent border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-violet-500/20">
                    <Brain className="w-6 h-6 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Visibility Audit</h3>
                    <p className="text-sm text-muted-foreground">
                      Optimize your content for ChatGPT, Perplexity, Google AI Overviews & more
                    </p>
                  </div>
                </div>
                <Link href="/geo">
                  <Button variant="outline" className="gap-2">
                    View GEO Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          {data?.categories && data.categories.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((cat) => {
                const Icon = categoryIcons[cat.category] || FileText;
                const total = cat.critical + cat.warning + cat.passed;
                const passRate = total > 0 ? Math.round((cat.passed / total) * 100) : 100;

                return (
                  <Card key={cat.category} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">{passRate}% passing</p>
                        </div>
                      </div>
                      <Progress value={passRate} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs">
                        {cat.critical > 0 && (
                          <span className="text-red-500">{cat.critical} critical</span>
                        )}
                        {cat.warning > 0 && (
                          <span className="text-yellow-500">{cat.warning} warnings</span>
                        )}
                        <span className="text-green-500">{cat.passed} passed</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Issues List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Issues</CardTitle>
                  <CardDescription>
                    {filteredIssues.length} issues found • {selectedIssues.length} selected
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        {filterSeverity === "all" ? "All Severities" : severityConfig[filterSeverity].label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setFilterSeverity("all")}>
                        All Severities
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSeverity("critical")}>
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        Critical
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSeverity("warning")}>
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                        Warnings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterSeverity("info")}>
                        <Info className="w-4 h-4 mr-2 text-blue-500" />
                        Info
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className="font-medium">No issues found!</p>
                  <p className="text-sm text-muted-foreground">
                    {filterSeverity === "all"
                      ? "Your site is looking great"
                      : `No ${filterSeverity} issues`}
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    selected={selectedIssues.includes(issue.id)}
                    onSelect={() => toggleIssue(issue.id)}
                    onFix={() => fixMutation.mutate(issue.id)}
                    isFixing={fixingIssue === issue.id}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedIssues.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
              <span className="text-sm font-medium">{selectedIssues.length} issues selected</span>
              <Button size="sm" variant="outline" onClick={() => setSelectedIssues([])}>
                Clear
              </Button>
              <Button size="sm" onClick={handleBulkFix} disabled={fixMutation.isPending}>
                {fixMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Auto-Fix Selected
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
