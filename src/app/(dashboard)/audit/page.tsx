"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Download,
  Zap,
  Globe,
  FileText,
  Image,
  Link2,
  Code,
  Gauge,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

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

interface CategoryStats {
  category: IssueCategory;
  label: string;
  icon: React.ElementType;
  critical: number;
  warning: number;
  passed: number;
}

// ============================================
// MOCK DATA
// ============================================

const mockIssues: AuditIssue[] = [
  {
    id: "1",
    category: "meta",
    severity: "critical",
    title: "Missing meta description",
    description: "8 pages are missing meta descriptions, which can hurt click-through rates in search results.",
    affectedUrl: "/about, /services, /contact...",
    canAutoFix: true,
  },
  {
    id: "2",
    category: "meta",
    severity: "warning",
    title: "Title tags too long",
    description: "5 pages have title tags exceeding 60 characters, which may be truncated in search results.",
    affectedUrl: "/blog/complete-guide-to-seo-...",
    currentValue: "Complete Guide to SEO: Everything You Need to Know in 2025 and Beyond",
    suggestedValue: "Complete Guide to SEO: Everything You Need in 2025",
    canAutoFix: true,
  },
  {
    id: "3",
    category: "images",
    severity: "critical",
    title: "Images missing alt text",
    description: "23 images are missing alt text, making them inaccessible and hurting image SEO.",
    canAutoFix: true,
  },
  {
    id: "4",
    category: "images",
    severity: "warning",
    title: "Large image files",
    description: "12 images exceed 500KB and should be compressed for better page speed.",
    canAutoFix: false,
  },
  {
    id: "5",
    category: "links",
    severity: "critical",
    title: "Broken internal links",
    description: "5 internal links point to pages that return 404 errors.",
    affectedUrl: "/old-page, /deleted-post...",
    canAutoFix: false,
  },
  {
    id: "6",
    category: "links",
    severity: "warning",
    title: "Orphan pages detected",
    description: "3 pages have no internal links pointing to them.",
    canAutoFix: true,
  },
  {
    id: "7",
    category: "content",
    severity: "warning",
    title: "Thin content pages",
    description: "4 pages have less than 300 words of content.",
    canAutoFix: false,
  },
  {
    id: "8",
    category: "content",
    severity: "info",
    title: "Duplicate H1 tags",
    description: "2 pages share the same H1 heading.",
    canAutoFix: true,
  },
  {
    id: "9",
    category: "technical",
    severity: "warning",
    title: "Missing canonical tags",
    description: "6 pages are missing canonical URLs.",
    canAutoFix: true,
  },
  {
    id: "10",
    category: "technical",
    severity: "info",
    title: "No structured data",
    description: "Blog posts are missing Article schema markup.",
    canAutoFix: true,
  },
  {
    id: "11",
    category: "performance",
    severity: "warning",
    title: "Slow page load time",
    description: "Average LCP is 3.2s, exceeding the recommended 2.5s threshold.",
    canAutoFix: false,
  },
  {
    id: "12",
    category: "performance",
    severity: "info",
    title: "Render-blocking resources",
    description: "3 CSS files are blocking initial render.",
    canAutoFix: false,
  },
];

const categoryStats: CategoryStats[] = [
  { category: "meta", label: "Meta Tags", icon: FileText, critical: 1, warning: 1, passed: 12 },
  { category: "content", label: "Content", icon: FileText, critical: 0, warning: 1, passed: 8 },
  { category: "images", label: "Images", icon: Image, critical: 1, warning: 1, passed: 45 },
  { category: "links", label: "Links", icon: Link2, critical: 1, warning: 1, passed: 156 },
  { category: "technical", label: "Technical", icon: Code, critical: 0, warning: 1, passed: 18 },
  { category: "performance", label: "Performance", icon: Gauge, critical: 0, warning: 1, passed: 5 },
];

// ============================================
// SEVERITY CONFIG
// ============================================

const severityConfig = {
  critical: { label: "Critical", color: "text-red-500", bgColor: "bg-red-500/10", icon: XCircle },
  warning: { label: "Warning", color: "text-yellow-500", bgColor: "bg-yellow-500/10", icon: AlertTriangle },
  info: { label: "Info", color: "text-blue-500", bgColor: "bg-blue-500/10", icon: Info },
  passed: { label: "Passed", color: "text-green-500", bgColor: "bg-green-500/10", icon: CheckCircle2 },
};

// ============================================
// SCORE RING
// ============================================

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-red-500";
  };

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
}: {
  issue: AuditIssue;
  selected: boolean;
  onSelect: () => void;
  onFix: () => void;
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
          <Button size="sm" variant="outline" onClick={onFix}>
            <Zap className="w-4 h-4 mr-1" />
            Auto-Fix
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AuditPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | "all">("all");

  const seoScore = 67;
  const totalCritical = mockIssues.filter((i) => i.severity === "critical").length;
  const totalWarnings = mockIssues.filter((i) => i.severity === "warning").length;
  const totalPassed = categoryStats.reduce((sum, cat) => sum + cat.passed, 0);

  const filteredIssues =
    filterSeverity === "all"
      ? mockIssues
      : mockIssues.filter((i) => i.severity === filterSeverity);

  const toggleIssue = (id: string) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleScan = async () => {
    setIsScanning(true);
    await new Promise((r) => setTimeout(r, 3000));
    setIsScanning(false);
  };

  const handleBulkFix = async () => {
    // In production, this would fix selected issues
    await new Promise((r) => setTimeout(r, 1000));
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
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={handleScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isScanning ? "Scanning..." : "Run New Audit"}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center">
            <ScoreRing score={seoScore} />
            <p className="mt-4 text-sm font-medium">SEO Health Score</p>
            <p className="text-xs text-muted-foreground">Last scanned: 2 hours ago</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Issues Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <p className="text-3xl font-bold text-red-500">{totalCritical}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                <p className="text-3xl font-bold text-yellow-500">{totalWarnings}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-3xl font-bold text-green-500">{totalPassed}</p>
                <p className="text-sm text-muted-foreground">Passed Checks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryStats.map((cat) => {
          const Icon = cat.icon;
          const total = cat.critical + cat.warning + cat.passed;
          const passRate = Math.round((cat.passed / total) * 100);

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
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              selected={selectedIssues.includes(issue.id)}
              onSelect={() => toggleIssue(issue.id)}
              onFix={() => console.log("Fix:", issue.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIssues.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIssues.length} issues selected</span>
          <Button size="sm" variant="outline" onClick={() => setSelectedIssues([])}>
            Clear
          </Button>
          <Button size="sm" onClick={handleBulkFix}>
            <Zap className="w-4 h-4 mr-2" />
            Auto-Fix Selected
          </Button>
        </div>
      )}
    </div>
  );
}
