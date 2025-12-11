"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Zap,
  Search,
  FileText,
  ExternalLink,
  AlertTriangle,
  Globe,
  ArrowUpRight,
  Unlink,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface LinkOpportunity {
  id: string;
  fromPage: string;
  fromTitle: string;
  toPage: string;
  toTitle: string;
  anchorText: string;
  context: string;
  impact: "high" | "medium" | "low";
  status: "pending" | "applied" | "ignored";
}

interface OrphanPage {
  id: string;
  url: string;
  title: string;
  incomingLinks: number;
  outgoingLinks: number;
}

interface LinksData {
  opportunities: LinkOpportunity[];
  orphanPages: OrphanPage[];
  stats: {
    total: number;
    pending: number;
    applied: number;
    orphanCount: number;
  };
}

// ============================================
// IMPACT BADGE
// ============================================

function ImpactBadge({ impact }: { impact: LinkOpportunity["impact"] }) {
  const config = {
    high: { label: "High Impact", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    low: { label: "Low", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  };

  return (
    <Badge variant="outline" className={config[impact].color}>
      {config[impact].label}
    </Badge>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function LinksLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <Card className="p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Link2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Link Opportunities Yet</h3>
        <p className="text-muted-foreground mb-6">
          Add content and let the AI analyze your site to find internal linking
          opportunities that can boost your SEO.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/content/new">
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </Link>
          <Link href="/audit">
            <Button variant="outline">Run Site Audit</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// OPPORTUNITY CARD
// ============================================

function OpportunityCard({
  opportunity,
  selected,
  onSelect,
  onApply,
  isApplying,
}: {
  opportunity: LinkOpportunity;
  selected: boolean;
  onSelect: () => void;
  onApply: () => void;
  isApplying: boolean;
}) {
  return (
    <Card className={`transition-all ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-1" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ImpactBadge impact={opportunity.impact} />
              {opportunity.status === "applied" && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm mb-2">
              <span className="font-medium truncate">{opportunity.fromTitle}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate text-primary">{opportunity.toTitle}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              Anchor text: <span className="font-mono text-primary">&quot;{opportunity.anchorText}&quot;</span>
            </p>

            {opportunity.context && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                ...{opportunity.context}...
              </p>
            )}
          </div>

          {opportunity.status === "pending" && (
            <Button size="sm" onClick={onApply} disabled={isApplying}>
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Apply
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function LinksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch links data
  const { data, isLoading, error, refetch } = useQuery<LinksData>({
    queryKey: ["links"],
    queryFn: async () => {
      const response = await fetch("/api/links");
      if (!response.ok) throw new Error("Failed to fetch links");
      const json = await response.json();
      return json.data;
    },
  });

  // Apply link mutation
  const applyMutation = useMutation({
    mutationFn: async ({ contentId, linkIndex }: { contentId: string; linkIndex: number }) => {
      setApplyingId(`${contentId}-${linkIndex}`);
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, linkIndex, action: "apply" }),
      });
      if (!response.ok) throw new Error("Failed to apply link");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      setApplyingId(null);
    },
    onError: () => {
      setApplyingId(null);
    },
  });

  const toggleLink = (id: string) => {
    setSelectedLinks((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleApply = (opportunity: LinkOpportunity) => {
    const [contentId, indexStr] = opportunity.id.split("-");
    applyMutation.mutate({ contentId, linkIndex: parseInt(indexStr) });
  };

  const filteredOpportunities = (data?.opportunities || []).filter(
    (o) =>
      o.fromTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.toTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.anchorText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingOpportunities = filteredOpportunities.filter((o) => o.status === "pending");
  const hasData = data && (data.opportunities.length > 0 || data.orphanPages.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Links</h1>
          <p className="text-muted-foreground">
            Optimize your site structure with smart internal linking
          </p>
        </div>
        <Button disabled={selectedLinks.length === 0}>
          <Zap className="w-4 h-4 mr-2" />
          Apply Selected ({selectedLinks.length})
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load links</p>
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
      {isLoading && <LinksLoading />}

      {/* Empty State */}
      {!isLoading && !error && !hasData && <EmptyState />}

      {/* Data View */}
      {!isLoading && hasData && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.total}</p>
                    <p className="text-xs text-muted-foreground">Opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <ArrowUpRight className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.applied}</p>
                    <p className="text-xs text-muted-foreground">Applied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Unlink className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.orphanCount}</p>
                    <p className="text-xs text-muted-foreground">Orphan Pages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="opportunities" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="opportunities">
                  Opportunities ({pendingOpportunities.length})
                </TabsTrigger>
                <TabsTrigger value="orphans">
                  Orphan Pages ({data.orphanPages.length})
                </TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-3">
              {pendingOpportunities.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No pending link opportunities. Run another audit to find more.
                  </p>
                </Card>
              ) : (
                pendingOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    selected={selectedLinks.includes(opportunity.id)}
                    onSelect={() => toggleLink(opportunity.id)}
                    onApply={() => handleApply(opportunity)}
                    isApplying={applyingId === opportunity.id}
                  />
                ))
              )}
            </TabsContent>

            {/* Orphan Pages Tab */}
            <TabsContent value="orphans">
              {data.orphanPages.length === 0 ? (
                <Card className="p-8 text-center">
                  <Globe className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="font-semibold mb-2">No Orphan Pages</h3>
                  <p className="text-muted-foreground">
                    All your pages have internal links pointing to them.
                  </p>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Pages Without Internal Links
                    </CardTitle>
                    <CardDescription>
                      These pages have no or very few internal links pointing to them
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.orphanPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {page.url}
                            <ExternalLink className="w-3 h-3" />
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-500">{page.incomingLinks}</p>
                            <p className="text-xs text-muted-foreground">Incoming</p>
                          </div>
                          <Link href={`/content/new?url=${encodeURIComponent(page.url)}`}>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Link to this
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}