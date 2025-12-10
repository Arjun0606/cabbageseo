"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Loader2,
  Zap,
  Clock,
  FileText,
  Link2,
  Image,
  Code,
  Smartphone,
  Gauge,
  Search,
  Globe,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";

// Types
interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info" | "passed";
  category: "technical" | "content" | "performance" | "mobile" | "security";
  affectedPages: number;
  howToFix: string;
  autoFixable: boolean;
  fixed?: boolean;
}

// Mock audit data
const mockAuditData = {
  score: 67,
  lastScan: "2024-12-09T10:30:00Z",
  pagesScanned: 47,
  issues: {
    critical: 3,
    warnings: 12,
    info: 8,
    passed: 45,
  },
  categories: {
    technical: { score: 72, issues: 5 },
    content: { score: 58, issues: 8 },
    performance: { score: 81, issues: 4 },
    mobile: { score: 78, issues: 3 },
    security: { score: 92, issues: 2 },
  },
};

const mockIssues: AuditIssue[] = [
  {
    id: "1",
    title: "Missing meta descriptions",
    description: "5 pages are missing meta descriptions, which can hurt CTR in search results.",
    severity: "critical",
    category: "content",
    affectedPages: 5,
    howToFix: "Add unique, keyword-rich meta descriptions (150-160 characters) to each page.",
    autoFixable: true,
  },
  {
    id: "2",
    title: "Broken internal links",
    description: "3 internal links point to pages that return 404 errors.",
    severity: "critical",
    category: "technical",
    affectedPages: 3,
    howToFix: "Update or remove the broken links pointing to non-existent pages.",
    autoFixable: true,
  },
  {
    id: "3",
    title: "Duplicate title tags",
    description: "2 pages have identical title tags, causing content confusion for search engines.",
    severity: "critical",
    category: "content",
    affectedPages: 2,
    howToFix: "Create unique title tags for each page that accurately describe the content.",
    autoFixable: true,
  },
  {
    id: "4",
    title: "Images missing alt text",
    description: "15 images don't have alt attributes, reducing accessibility and image SEO.",
    severity: "warning",
    category: "content",
    affectedPages: 8,
    howToFix: "Add descriptive alt text to all images that conveys their content or function.",
    autoFixable: true,
  },
  {
    id: "5",
    title: "Slow page load time",
    description: "4 pages take more than 3 seconds to load on mobile connections.",
    severity: "warning",
    category: "performance",
    affectedPages: 4,
    howToFix: "Optimize images, enable compression, and minimize JavaScript to improve load times.",
    autoFixable: false,
  },
  {
    id: "6",
    title: "Missing canonical tags",
    description: "8 pages are missing canonical tags, which may cause duplicate content issues.",
    severity: "warning",
    category: "technical",
    affectedPages: 8,
    howToFix: "Add self-referencing canonical tags to all pages.",
    autoFixable: true,
  },
  {
    id: "7",
    title: "Low content word count",
    description: "6 pages have fewer than 300 words, which may be considered thin content.",
    severity: "warning",
    category: "content",
    affectedPages: 6,
    howToFix: "Expand the content on these pages with valuable, relevant information.",
    autoFixable: false,
  },
  {
    id: "8",
    title: "HTTPS not enforced",
    description: "Some resources are loaded over HTTP instead of HTTPS.",
    severity: "warning",
    category: "security",
    affectedPages: 2,
    howToFix: "Update all resource URLs to use HTTPS.",
    autoFixable: true,
  },
  {
    id: "9",
    title: "Missing viewport meta tag",
    description: "1 page is missing the viewport meta tag for mobile responsiveness.",
    severity: "warning",
    category: "mobile",
    affectedPages: 1,
    howToFix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the page head.",
    autoFixable: true,
  },
  {
    id: "10",
    title: "Using deprecated HTML",
    description: "2 pages use deprecated HTML tags that may not render correctly.",
    severity: "info",
    category: "technical",
    affectedPages: 2,
    howToFix: "Replace deprecated tags with modern HTML5 equivalents.",
    autoFixable: false,
  },
];

function getScoreColor(score: number) {
  if (score >= 80) return { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" };
  if (score >= 60) return { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-50" };
  if (score >= 40) return { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" };
  return { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50" };
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", badge: "bg-red-100 text-red-700" };
    case "warning":
      return { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", badge: "bg-yellow-100 text-yellow-700" };
    case "info":
      return { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", badge: "bg-blue-100 text-blue-700" };
    case "passed":
      return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", badge: "bg-green-100 text-green-700" };
    default:
      return { icon: Info, color: "text-slate-600", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-700" };
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "technical": return Code;
    case "content": return FileText;
    case "performance": return Gauge;
    case "mobile": return Smartphone;
    case "security": return ShieldCheck;
    default: return Globe;
  }
}

export default function AuditPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [fixingIssues, setFixingIssues] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 100));
      setScanProgress(i);
    }
    
    setIsScanning(false);
  };

  const toggleIssue = (id: string) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIssues(newSelected);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const selectAutoFixable = () => {
    const autoFixableIds = mockIssues.filter(i => i.autoFixable && i.severity !== "passed").map(i => i.id);
    setSelectedIssues(new Set(autoFixableIds));
  };

  const handleFixSelected = async () => {
    setFixingIssues(true);
    await new Promise(r => setTimeout(r, 3000));
    setFixingIssues(false);
    setSelectedIssues(new Set());
  };

  const scoreColors = getScoreColor(mockAuditData.score);
  const criticalAndWarnings = mockIssues.filter(i => i.severity === "critical" || i.severity === "warning");

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Technical SEO Audit"
        description="Find and fix issues that hurt your search rankings"
      />

      <div className="p-6 space-y-6">
        {/* Scan Banner */}
        {isScanning ? (
          <Card className="border-cabbage-200 dark:border-cabbage-800">
            <CardContent className="py-8">
              <div className="max-w-md mx-auto text-center space-y-4">
                <Loader2 className="h-12 w-12 text-cabbage-600 animate-spin mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Scanning your site...</h3>
                  <p className="text-sm text-slate-500">Analyzing {mockAuditData.pagesScanned} pages for SEO issues</p>
                </div>
                <Progress value={scanProgress} className="h-2" />
                <p className="text-sm text-slate-400">{scanProgress}% complete</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Score Overview */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Main Score Card */}
              <Card className="md:col-span-1 overflow-hidden">
                <div className={`h-2 ${scoreColors.bg}`} />
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${scoreColors.light} dark:bg-opacity-20 mb-4`}>
                      <span className={`text-5xl font-bold ${scoreColors.text}`}>
                        {mockAuditData.score}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">SEO Health Score</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {mockAuditData.score >= 80 ? "Great job! Your site is well optimized." :
                       mockAuditData.score >= 60 ? "Good, but there's room for improvement." :
                       "Your site needs attention to rank better."}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span>Last scan: {new Date(mockAuditData.lastScan).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues Summary */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Issues Found</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm">Critical</span>
                    </div>
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {mockAuditData.issues.critical}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Warnings</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      {mockAuditData.issues.warnings}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Info</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {mockAuditData.issues.info}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Passed</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {mockAuditData.issues.passed}
                    </Badge>
                  </div>
                  <Button onClick={handleScan} className="w-full gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Re-scan Site
                  </Button>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(mockAuditData.categories).map(([category, data]) => {
                    const Icon = getCategoryIcon(category);
                    const colors = getScoreColor(data.score);
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm capitalize">{category}</span>
                            <span className={`text-sm font-semibold ${colors.text}`}>{data.score}</span>
                          </div>
                          <Progress value={data.score} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Action Bar */}
            {selectedIssues.size > 0 && (
              <Card className="border-cabbage-200 bg-cabbage-50 dark:border-cabbage-800 dark:bg-cabbage-950">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-sm">
                        {selectedIssues.size} issues selected
                      </Badge>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {mockIssues.filter(i => selectedIssues.has(i.id) && i.autoFixable).length} can be auto-fixed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedIssues(new Set())}>
                        Clear Selection
                      </Button>
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={handleFixSelected}
                        disabled={fixingIssues}
                      >
                        {fixingIssues ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Fix Selected
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Issues</CardTitle>
                    <CardDescription>Click to expand and see how to fix each issue</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAutoFixable}>
                      Select Auto-fixable
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All ({mockIssues.length})</TabsTrigger>
                    <TabsTrigger value="critical">Critical ({mockAuditData.issues.critical})</TabsTrigger>
                    <TabsTrigger value="warning">Warnings ({mockAuditData.issues.warnings})</TabsTrigger>
                    <TabsTrigger value="info">Info ({mockAuditData.issues.info})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4 space-y-3">
                    {mockIssues.map((issue) => {
                      const config = getSeverityConfig(issue.severity);
                      const Icon = config.icon;
                      const isExpanded = expandedIssues.has(issue.id);
                      const CategoryIcon = getCategoryIcon(issue.category);
                      
                      return (
                        <div
                          key={issue.id}
                          className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all ${
                            selectedIssues.has(issue.id) ? "ring-2 ring-cabbage-500" : ""
                          }`}
                        >
                          <div
                            className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${config.bg}`}
                            onClick={() => toggleExpand(issue.id)}
                          >
                            <Checkbox
                              checked={selectedIssues.has(issue.id)}
                              onCheckedChange={() => toggleIssue(issue.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Icon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {issue.title}
                                </p>
                                {issue.autoFixable && (
                                  <Badge variant="outline" className="text-xs bg-cabbage-50 text-cabbage-700 border-cabbage-200">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Auto-fix
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{issue.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge className={config.badge} variant="secondary">
                                  {issue.affectedPages} pages
                                </Badge>
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                    How to Fix
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {issue.howToFix}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                    Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <CategoryIcon className="h-4 w-4 text-slate-400" />
                                      <span className="capitalize">{issue.category}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-slate-400" />
                                      <span>{issue.affectedPages} affected pages</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                {issue.autoFixable && (
                                  <Button size="sm" className="gap-2">
                                    <Zap className="h-4 w-4" />
                                    Auto-fix Now
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" className="gap-2">
                                  View Affected Pages
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="critical" className="mt-4 space-y-3">
                    {mockIssues.filter(i => i.severity === "critical").map((issue) => {
                      const config = getSeverityConfig(issue.severity);
                      const Icon = config.icon;
                      return (
                        <div key={issue.id} className={`flex items-center gap-4 p-4 rounded-xl border ${config.bg}`}>
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{issue.title}</p>
                            <p className="text-sm text-slate-500">{issue.description}</p>
                          </div>
                          <Button size="sm" className="gap-2">
                            <Zap className="h-4 w-4" />
                            Fix
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="warning" className="mt-4 space-y-3">
                    {mockIssues.filter(i => i.severity === "warning").map((issue) => {
                      const config = getSeverityConfig(issue.severity);
                      const Icon = config.icon;
                      return (
                        <div key={issue.id} className={`flex items-center gap-4 p-4 rounded-xl border ${config.bg}`}>
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{issue.title}</p>
                            <p className="text-sm text-slate-500">{issue.description}</p>
                          </div>
                          <Button size="sm" variant="outline" className="gap-2">
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="info" className="mt-4 space-y-3">
                    {mockIssues.filter(i => i.severity === "info").map((issue) => {
                      const config = getSeverityConfig(issue.severity);
                      const Icon = config.icon;
                      return (
                        <div key={issue.id} className={`flex items-center gap-4 p-4 rounded-xl border ${config.bg}`}>
                          <div className={`p-2 rounded-lg ${config.bg}`}>
                            <Icon className={`h-5 w-5 ${config.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{issue.title}</p>
                            <p className="text-sm text-slate-500">{issue.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

