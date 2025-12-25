"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Globe,
  Settings,
  TrendingUp,
  FileText,
  Target,
  ExternalLink,
  MoreVertical,
  Trash2,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ============================================
// TYPES
// ============================================

interface Site {
  id: string;
  domain: string;
  name: string;
  url: string;
  status: string;
  keywords: number;
  content: number;
  issues: number;
  gscConnected: boolean;
  cmsConnected: boolean;
  cmsType: string | null;
  autopilotEnabled: boolean;
  createdAt: string;
}

interface SitesData {
  sites: Site[];
  stats: {
    total: number;
    withGSC: number;
    withCMS: number;
  };
}

// ============================================
// LOADING SKELETON
// ============================================

function SitesLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ onAddSite }: { onAddSite: () => void }) {
  return (
    <Card className="p-12">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Sites Yet</h3>
        <p className="text-muted-foreground mb-6">
          Add your first website to start tracking SEO performance,
          generating content, and improving rankings.
        </p>
        <Button onClick={onAddSite}>
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Site
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// SITE CARD
// ============================================

function SiteCard({ site, onDelete }: { site: Site; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link href={`/sites/${site.id}`} className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{site.name}</CardTitle>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                {site.domain}
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/settings/integrations?site=${site.id}`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/autopilot?site=${site.id}`}>
                  <Zap className="w-4 h-4 mr-2" />
                  Autopilot
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{site.keywords.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Keywords</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{site.content}</p>
            <p className="text-xs text-muted-foreground">Content</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">{site.issues}</p>
            <p className="text-xs text-muted-foreground">Issues</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex flex-wrap gap-2">
          {site.gscConnected ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              GSC Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Link2 className="w-3 h-3 mr-1" />
              Connect GSC
            </Badge>
          )}
          {site.cmsConnected ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {site.cmsType?.toUpperCase()}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Link2 className="w-3 h-3 mr-1" />
              Connect CMS
            </Badge>
          )}
          {site.autopilotEnabled && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Zap className="w-3 h-3 mr-1" />
              Autopilot
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link href={`/keywords?site=${site.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Target className="w-4 h-4 mr-2" />
              Keywords
            </Button>
          </Link>
          <Link href={`/content?site=${site.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SitesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSiteDomain, setNewSiteDomain] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const queryClient = useQueryClient();

  // Fetch sites
  const { data, isLoading, error, refetch } = useQuery<SitesData>({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetch("/api/sites");
      if (!response.ok) throw new Error("Failed to fetch sites");
      const json = await response.json();
      return json.data;
    },
  });

  // Create site mutation
  const createMutation = useMutation({
    mutationFn: async (siteData: { domain: string; name: string }) => {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteData),
      });
      if (!response.ok) throw new Error("Failed to create site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    setIsAddDialogOpen(false);
    setNewSiteDomain("");
    setNewSiteName("");
    },
  });

  // Delete site mutation
  const deleteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await fetch(`/api/sites?id=${siteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  const handleAddSite = () => {
    if (!newSiteDomain.trim()) return;
    createMutation.mutate({
      domain: newSiteDomain,
      name: newSiteName || newSiteDomain,
    });
  };

  const hasData = data && data.sites.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage your connected websites
          </p>
        </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
              <Plus className="w-4 h-4 mr-2" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
                <DialogDescription>
                Enter your website details to start tracking SEO
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newSiteDomain}
                    onChange={(e) => setNewSiteDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                <Label htmlFor="name">Site Name (optional)</Label>
                  <Input
                    id="name"
                  placeholder="My Website"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              <Button
                onClick={handleAddSite}
                disabled={!newSiteDomain.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Site
              </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load sites</p>
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
      {isLoading && <SitesLoading />}

      {/* Empty State */}
      {!isLoading && !error && !hasData && (
        <EmptyState onAddSite={() => setIsAddDialogOpen(true)} />
      )}

      {/* Sites Grid */}
      {hasData && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Sites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.withGSC}</p>
                    <p className="text-xs text-muted-foreground">GSC Connected</p>
                  </div>
                    </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.withCMS}</p>
                    <p className="text-xs text-muted-foreground">CMS Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sites */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onDelete={() => deleteMutation.mutate(site.id)}
              />
            ))}
              </div>
        </>
      )}
    </div>
  );
}
