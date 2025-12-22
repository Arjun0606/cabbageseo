"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  ArrowLeft,
  Settings,
  Trash2,
  RefreshCw,
  BarChart3,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Target,
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface SiteData {
  id: string;
  domain: string;
  name: string;
  url: string;
  seoScore: number;
  aioScore: number;
  pagesCount: number;
  keywordsTracked: number;
  lastCrawlAt: string | null;
  status: string;
  issues: {
    critical: number;
    warnings: number;
    passed: number;
  };
  topKeywords: Array<{
    keyword: string;
    position: number;
    change: number;
  }>;
  recentContent: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-500";
    if (s >= 60) return "stroke-yellow-500";
    if (s >= 40) return "stroke-orange-500";
    return "stroke-red-500";
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-zinc-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

export default function SiteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const siteId = params.siteId as string;

  const { data: site, isLoading, error } = useQuery<SiteData>({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const response = await fetch(`/api/sites?id=${siteId}`);
      if (!response.ok) throw new Error("Failed to fetch site");
      const json = await response.json();
      return json.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sites?id=${siteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete site");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      router.push("/sites");
    },
  });

  const recrawlMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      if (!response.ok) throw new Error("Failed to start crawl");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
    },
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !site) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Site not found</h2>
        <p className="text-zinc-400 mb-4">
          The site you're looking for doesn't exist or you don't have access.
        </p>
        <Button asChild>
          <Link href="/sites">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white">
            <Link href="/sites">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{site.name || site.domain}</h1>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
              >
                {site.domain}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recrawlMutation.mutate()}
            disabled={recrawlMutation.isPending}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            {recrawlMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Re-crawl
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Site?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This will permanently delete {site.domain} and all associated data including 
                  keywords, content, and audit history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-red-600 hover:bg-red-500"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete Site"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">SEO Score</p>
                <p className="text-2xl font-bold text-white mt-1">{site.seoScore}/100</p>
              </div>
              <ScoreRing score={site.seoScore} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">AIO Score</p>
                <p className="text-2xl font-bold text-white mt-1">{site.aioScore}/100</p>
              </div>
              <ScoreRing score={site.aioScore} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Pages Indexed</p>
                <p className="text-2xl font-bold text-white">{site.pagesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Keywords Tracked</p>
                <p className="text-2xl font-bold text-white">{site.keywordsTracked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Summary */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Technical Issues
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {site.lastCrawlAt
              ? `Last crawled ${new Date(site.lastCrawlAt).toLocaleDateString()}`
              : "Not crawled yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-400">Critical</span>
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                  {site.issues.critical}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{site.issues.critical}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-400">Warnings</span>
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  {site.issues.warnings}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{site.issues.warnings}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-400">Passed</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  {site.issues.passed}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{site.issues.passed}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-500">
              <Link href="/audit">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Full Audit
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Link href="/links">
                <Link2 className="w-4 h-4 mr-2" />
                Internal Links
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Keywords */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Top Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            {site.topKeywords && site.topKeywords.length > 0 ? (
              <div className="space-y-3">
                {site.topKeywords.slice(0, 5).map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800">
                    <span className="text-white">{kw.keyword}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-zinc-700">
                        #{kw.position}
                      </Badge>
                      {kw.change !== 0 && (
                        <span className={kw.change > 0 ? "text-green-400" : "text-red-400"}>
                          {kw.change > 0 ? "+" : ""}{kw.change}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No keywords tracked yet</p>
                <Button asChild variant="outline" size="sm" className="mt-3 border-zinc-700">
                  <Link href="/keywords">Add Keywords</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Recent Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {site.recentContent && site.recentContent.length > 0 ? (
              <div className="space-y-3">
                {site.recentContent.slice(0, 5).map((content) => (
                  <Link
                    key={content.id}
                    href={`/content/${content.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <span className="text-white truncate">{content.title}</span>
                    <Badge variant="outline" className="border-zinc-700 capitalize">
                      {content.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No content created yet</p>
                <Button asChild variant="outline" size="sm" className="mt-3 border-zinc-700">
                  <Link href="/content/new">Create Content</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

