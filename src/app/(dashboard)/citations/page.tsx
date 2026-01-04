"use client";

/**
 * ============================================
 * CITATIONS PAGE
 * ============================================
 * 
 * View all your AI citations in one place.
 * Filter by platform, date, query.
 * Export for reporting.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Eye,
  Search,
  Bot,
  Sparkles,
  Globe,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ============================================
// TYPES
// ============================================

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  pageUrl?: string;
  confidence: "high" | "medium" | "low";
  citedAt: string;
  lastCheckedAt: string;
}

// ============================================
// HELPERS
// ============================================

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case "perplexity":
      return <Search className="w-4 h-4 text-purple-400" />;
    case "google_aio":
      return <Sparkles className="w-4 h-4 text-blue-400" />;
    case "chatgpt":
      return <Bot className="w-4 h-4 text-green-400" />;
    default:
      return <Globe className="w-4 h-4 text-zinc-400" />;
  }
}

function PlatformName({ platform }: { platform: string }) {
  switch (platform) {
    case "perplexity":
      return "Perplexity";
    case "google_aio":
      return "Google AI";
    case "chatgpt":
      return "ChatGPT";
    default:
      return platform;
  }
}

// ============================================
// STORAGE
// ============================================

const SITE_KEY = "cabbageseo_site";

function loadSite(): { id: string; domain: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(SITE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CitationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<{ id: string; domain: string } | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    const cached = loadSite();
    if (!cached) {
      router.push("/dashboard");
      return;
    }
    setSite(cached);
    fetchCitations(cached.id);
  }, [router]);

  const fetchCitations = async (siteId: string) => {
    try {
      const res = await fetch(`/api/geo/citations?siteId=${siteId}&all=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.citations) {
          setCitations(data.data.citations.map((c: {
            id: string;
            platform: string;
            query: string;
            snippet: string;
            page_url?: string;
            confidence: string;
            cited_at: string;
            last_checked_at: string;
          }) => ({
            id: c.id,
            platform: c.platform,
            query: c.query,
            snippet: c.snippet,
            pageUrl: c.page_url,
            confidence: c.confidence,
            citedAt: c.cited_at,
            lastCheckedAt: c.last_checked_at,
          })));
        }
      }
    } catch (error) {
      console.error("Failed to fetch citations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter citations
  const filteredCitations = citations.filter(c => {
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (searchQuery && !c.query.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: citations.length,
    perplexity: citations.filter(c => c.platform === "perplexity").length,
    googleAio: citations.filter(c => c.platform === "google_aio").length,
    chatgpt: citations.filter(c => c.platform === "chatgpt").length,
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Platform", "Query", "Snippet", "Confidence", "First Seen"];
    const rows = filteredCitations.map(c => [
      PlatformName({ platform: c.platform }),
      c.query,
      c.snippet.replace(/,/g, ";"),
      c.confidence,
      new Date(c.citedAt).toLocaleDateString(),
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations-${site?.domain}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-6 w-6 text-emerald-500" />
              <h1 className="text-2xl font-bold text-white">All Citations</h1>
            </div>
            <p className="text-zinc-400">
              Every time AI mentioned <span className="text-emerald-400">{site?.domain}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={exportCSV}
              className="border-zinc-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => site && fetchCitations(site.id)}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <p className="text-sm text-zinc-400">Total</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-400">Perplexity</p>
                <p className="text-3xl font-bold text-white">{stats.perplexity}</p>
              </div>
              <Search className="h-8 w-8 text-purple-400/30" />
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-400">Google AI</p>
                <p className="text-3xl font-bold text-white">{stats.googleAio}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-400/30" />
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-400">ChatGPT</p>
                <p className="text-3xl font-bold text-white">{stats.chatgpt}</p>
              </div>
              <Bot className="h-8 w-8 text-green-400/30" />
            </CardContent>
          </Card>
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search queries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={platformFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("all")}
              className={platformFilter === "all" ? "bg-emerald-600" : "border-zinc-700"}
            >
              All
            </Button>
            <Button
              variant={platformFilter === "perplexity" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("perplexity")}
              className={platformFilter === "perplexity" ? "bg-purple-600" : "border-zinc-700"}
            >
              <Search className="h-3 w-3 mr-1" /> Perplexity
            </Button>
            <Button
              variant={platformFilter === "google_aio" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("google_aio")}
              className={platformFilter === "google_aio" ? "bg-blue-600" : "border-zinc-700"}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Google AI
            </Button>
            <Button
              variant={platformFilter === "chatgpt" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("chatgpt")}
              className={platformFilter === "chatgpt" ? "bg-green-600" : "border-zinc-700"}
            >
              <Bot className="h-3 w-3 mr-1" /> ChatGPT
            </Button>
          </div>
        </div>

        {/* CITATIONS LIST */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {filteredCitations.length === 0 ? (
              <div className="text-center py-16">
                <Eye className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">No citations found</p>
                <p className="text-sm text-zinc-500">
                  {citations.length === 0 
                    ? "Run a citation check from the dashboard to start tracking."
                    : "Try adjusting your filters."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {filteredCitations.map((citation) => (
                  <div key={citation.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                        <PlatformIcon platform={citation.platform} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            <PlatformName platform={citation.platform} />
                          </span>
                          <Badge
                            className={
                              citation.confidence === "high"
                                ? "bg-green-500/20 text-green-400"
                                : citation.confidence === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-zinc-500/20 text-zinc-400"
                            }
                          >
                            {citation.confidence}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {new Date(citation.citedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-300 mb-2">
                          Query: "<span className="text-emerald-400">{citation.query}</span>"
                        </p>
                        {citation.snippet && (
                          <p className="text-sm text-zinc-500 italic">
                            "{citation.snippet.slice(0, 200)}..."
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BACK LINK */}
        <Link href="/dashboard" className="text-zinc-500 hover:text-white flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

