"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Zap,
  Search,
  FileText,
  ExternalLink,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertTriangle,
  Globe,
  ArrowUpRight,
  Unlink,
} from "lucide-react";

// Types
interface InternalLinkOpportunity {
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
  url: string;
  title: string;
  incomingLinks: number;
  pageAuthority: number;
}

// Mock data
const mockOpportunities: InternalLinkOpportunity[] = [
  {
    id: "1",
    fromPage: "/blog/seo-guide",
    fromTitle: "The Complete SEO Guide",
    toPage: "/services/seo-audit",
    toTitle: "SEO Audit Service",
    anchorText: "professional SEO audit",
    context: "...consider getting a professional SEO audit to identify hidden issues...",
    impact: "high",
    status: "pending",
  },
  {
    id: "2",
    fromPage: "/blog/content-marketing",
    fromTitle: "Content Marketing 101",
    toPage: "/blog/keyword-research",
    toTitle: "Keyword Research Guide",
    anchorText: "keyword research",
    context: "...always start with thorough keyword research before creating content...",
    impact: "high",
    status: "pending",
  },
  {
    id: "3",
    fromPage: "/about",
    fromTitle: "About Us",
    toPage: "/case-studies",
    toTitle: "Case Studies",
    anchorText: "our case studies",
    context: "...see the amazing results we've achieved in our case studies...",
    impact: "medium",
    status: "pending",
  },
  {
    id: "4",
    fromPage: "/services",
    fromTitle: "Our Services",
    toPage: "/blog/seo-tips",
    toTitle: "10 SEO Tips",
    anchorText: "SEO tips",
    context: "...learn more from these actionable SEO tips from our experts...",
    impact: "medium",
    status: "pending",
  },
  {
    id: "5",
    fromPage: "/pricing",
    fromTitle: "Pricing",
    toPage: "/contact",
    toTitle: "Contact Us",
    anchorText: "get in touch",
    context: "...have questions about our plans? get in touch with our team...",
    impact: "low",
    status: "pending",
  },
];

const mockOrphanPages: OrphanPage[] = [
  { url: "/blog/old-post-2023", title: "SEO Trends 2023", incomingLinks: 0, pageAuthority: 12 },
  { url: "/resources/template", title: "Free SEO Template", incomingLinks: 1, pageAuthority: 8 },
  { url: "/blog/case-study-acme", title: "Case Study: ACME Corp", incomingLinks: 1, pageAuthority: 15 },
];

const linkStats = {
  totalOpportunities: 47,
  appliedToday: 12,
  avgImpact: "+18%",
  orphanPages: 3,
};

const impactColors = {
  high: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function LinksPage() {
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLinks(newSelected);
  };

  const selectAll = () => {
    const pendingIds = opportunities.filter(o => o.status === "pending").map(o => o.id);
    setSelectedLinks(new Set(pendingIds));
  };

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise(r => setTimeout(r, 2000));
    
    setOpportunities(opportunities.map(o => 
      selectedLinks.has(o.id) ? { ...o, status: "applied" as const } : o
    ));
    setSelectedLinks(new Set());
    setIsApplying(false);
  };

  const pendingCount = opportunities.filter(o => o.status === "pending").length;
  const appliedCount = opportunities.filter(o => o.status === "applied").length;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Internal Links"
        description="Strengthen your site structure with strategic internal linking"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Opportunities</p>
                  <p className="text-2xl font-bold">{linkStats.totalOpportunities}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Link2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Applied Today</p>
                  <p className="text-2xl font-bold text-green-600">{linkStats.appliedToday}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg. Impact</p>
                  <p className="text-2xl font-bold text-cabbage-600">{linkStats.avgImpact}</p>
                </div>
                <div className="p-3 rounded-full bg-cabbage-100 dark:bg-cabbage-900">
                  <TrendingUp className="h-5 w-5 text-cabbage-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Orphan Pages</p>
                  <p className="text-2xl font-bold text-orange-600">{linkStats.orphanPages}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Unlink className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        {selectedLinks.size > 0 && (
          <Card className="border-cabbage-200 bg-cabbage-50 dark:border-cabbage-800 dark:bg-cabbage-950">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm">
                    {selectedLinks.size} links selected
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {opportunities.filter(o => selectedLinks.has(o.id) && o.impact === "high").length} high impact
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLinks(new Set())}>
                    Clear
                  </Button>
                  <Button size="sm" className="gap-2" onClick={handleApply} disabled={isApplying}>
                    {isApplying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Apply Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="opportunities" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="opportunities" className="gap-2">
                <Link2 className="h-4 w-4" />
                Opportunities ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="applied" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Applied ({appliedCount})
              </TabsTrigger>
              <TabsTrigger value="orphans" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Orphan Pages ({mockOrphanPages.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search pages..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64" 
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Scan
              </Button>
            </div>
          </div>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Link Opportunities</CardTitle>
                    <CardDescription>AI-discovered internal linking opportunities</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All Pending
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.filter(o => o.status === "pending").map((link) => (
                    <div
                      key={link.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedLinks.has(link.id)
                          ? "border-cabbage-500 bg-cabbage-50 dark:bg-cabbage-950"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                      onClick={() => toggleLink(link.id)}
                    >
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedLinks.has(link.id)}
                          onCheckedChange={() => toggleLink(link.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          {/* From -> To */}
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium truncate max-w-[200px]">{link.fromTitle}</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="flex items-center gap-1 text-cabbage-600">
                              <Globe className="h-4 w-4" />
                              <span className="font-medium truncate max-w-[200px]">{link.toTitle}</span>
                            </div>
                          </div>

                          {/* Context */}
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            "...{link.context.split(link.anchorText)[0]}
                            <span className="text-cabbage-600 font-medium underline">{link.anchorText}</span>
                            {link.context.split(link.anchorText)[1]}..."
                          </p>

                          {/* URLs */}
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{link.fromPage}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{link.toPage}</span>
                          </div>
                        </div>

                        <Badge className={impactColors[link.impact]}>
                          {link.impact} impact
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {opportunities.filter(o => o.status === "pending").length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                      <p className="text-slate-500">No pending link opportunities. Run a scan to find more.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applied Tab */}
          <TabsContent value="applied">
            <Card>
              <CardHeader>
                <CardTitle>Applied Links</CardTitle>
                <CardDescription>Links that have been added to your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.filter(o => o.status === "applied").map((link) => (
                    <div key={link.id} className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{link.fromTitle}</span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                          <span className="text-cabbage-600">{link.toTitle}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Anchor: "{link.anchorText}"</p>
                      </div>
                      <Badge className={impactColors[link.impact]}>{link.impact}</Badge>
                    </div>
                  ))}

                  {opportunities.filter(o => o.status === "applied").length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No links applied yet. Select opportunities and click "Apply Selected".
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orphan Pages Tab */}
          <TabsContent value="orphans">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Orphan Pages
                </CardTitle>
                <CardDescription>Pages with no or very few internal links pointing to them</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOrphanPages.map((page) => (
                    <div key={page.url} className="flex items-center justify-between p-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                      <div className="flex items-center gap-4">
                        <Unlink className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{page.title}</p>
                          <p className="text-sm text-slate-500">{page.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{page.incomingLinks} links</p>
                          <p className="text-xs text-slate-500">PA: {page.pageAuthority}</p>
                        </div>
                        <Button size="sm" className="gap-2">
                          <Link2 className="h-4 w-4" />
                          Find Links
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

