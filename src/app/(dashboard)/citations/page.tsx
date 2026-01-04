"use client";

/**
 * ============================================
 * CITATIONS PAGE
 * ============================================
 * 
 * Browse all your AI citations.
 * Filter, search, export.
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
  Download,
  RefreshCw,
  ExternalLink,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

// ============================================
// PLATFORM CONFIG
// ============================================

const platformConfig = {
  perplexity: {
    name: "Perplexity",
    icon: Search,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    activeBg: "bg-violet-500",
  },
  google_aio: {
    name: "Google AI",
    icon: Sparkles,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    activeBg: "bg-blue-500",
  },
  chatgpt: {
    name: "ChatGPT",
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    activeBg: "bg-emerald-500",
  },
};

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
          }) => ({
            id: c.id,
            platform: c.platform,
            query: c.query,
            snippet: c.snippet,
            pageUrl: c.page_url,
            confidence: c.confidence,
            citedAt: c.cited_at,
          })));
        }
      }
    } catch (error) {
      console.error("Failed to fetch citations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filtered = citations.filter(c => {
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

  // Export
  const exportCSV = () => {
    const headers = ["Platform", "Query", "Snippet", "Confidence", "Date"];
    const rows = filtered.map(c => [
      platformConfig[c.platform]?.name || c.platform,
      `"${c.query.replace(/"/g, '""')}"`,
      `"${(c.snippet || "").replace(/"/g, '""')}"`,
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">All Citations</h1>
              <p className="text-sm text-zinc-500">
                AI mentions of <span className="text-emerald-400">{site?.domain}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => site && fetchCitations(site.id)}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`p-4 rounded-xl border transition-all text-left ${
            platformFilter === "all"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-[#0a0a0f] border-white/5 hover:border-white/10"
          }`}
        >
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
        </button>
        
        {(["perplexity", "google_aio", "chatgpt"] as const).map((platform) => {
          const config = platformConfig[platform];
          const Icon = config.icon;
          const count = platform === "perplexity" ? stats.perplexity : platform === "google_aio" ? stats.googleAio : stats.chatgpt;
          
          return (
            <button
              key={platform}
              onClick={() => setPlatformFilter(platformFilter === platform ? "all" : platform)}
              className={`p-4 rounded-xl border transition-all text-left ${
                platformFilter === platform
                  ? `${config.bg} border-white/20`
                  : "bg-[#0a0a0f] border-white/5 hover:border-white/10"
              }`}
            >
              <p className={`text-xs ${config.color} flex items-center gap-1 mb-1`}>
                <Icon className="w-3 h-3" /> {config.name}
              </p>
              <p className="text-2xl font-bold text-white font-mono">{count}</p>
            </button>
          );
        })}
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0a0a0f] border-white/10 focus:border-emerald-500/50 h-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* CITATIONS LIST */}
      <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No citations found</h3>
              <p className="text-zinc-500 max-w-sm mx-auto">
                {citations.length === 0 
                  ? "Run a citation check from the dashboard to start tracking."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((citation) => {
                const config = platformConfig[citation.platform];
                const Icon = config.icon;
                
                return (
                  <div key={citation.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-sm font-medium ${config.color}`}>
                            {config.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              citation.confidence === "high"
                                ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                                : citation.confidence === "medium"
                                ? "border-amber-500/30 text-amber-400 text-[10px]"
                                : "border-zinc-500/30 text-zinc-400 text-[10px]"
                            }
                          >
                            {citation.confidence}
                          </Badge>
                          <span className="text-xs text-zinc-600 ml-auto">
                            {new Date(citation.citedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white mb-2">
                          "{citation.query}"
                        </p>
                        {citation.snippet && (
                          <p className="text-sm text-zinc-500 italic line-clamp-2">
                            {citation.snippet}
                          </p>
                        )}
                        {citation.pageUrl && (
                          <a 
                            href={citation.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
