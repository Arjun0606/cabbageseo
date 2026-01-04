"use client";

/**
 * ============================================
 * CITATIONS PAGE
 * ============================================
 * 
 * All citations for the selected site.
 * Filter by platform, search, export.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Eye,
  Search,
  Bot,
  Sparkles,
  Download,
  RefreshCw,
  ExternalLink,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const platforms = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10", activeBg: "bg-violet-500" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10", activeBg: "bg-blue-500" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10", activeBg: "bg-emerald-500" },
};

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  page_url?: string;
  confidence: string;
  cited_at: string;
}

interface Site {
  id: string;
  domain: string;
}

export default function CitationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get sites first
      const sitesRes = await fetch("/api/sites");
      if (!sitesRes.ok) {
        router.push("/dashboard");
        return;
      }

      const sitesData = await sitesRes.json();
      const sites = sitesData.sites || [];
      
      if (sites.length === 0) {
        router.push("/dashboard");
        return;
      }

      // Get saved site or first one
      const savedId = localStorage.getItem("cabbageseo_site_id");
      const selectedSite = sites.find((s: Site) => s.id === savedId) || sites[0];
      setSite(selectedSite);

      // Load citations
      await loadCitations(selectedSite.id);
    } catch (err) {
      console.error("Failed to load:", err);
      router.push("/dashboard");
    }
  };

  const loadCitations = async (siteId: string) => {
    try {
      const res = await fetch(`/api/geo/citations?siteId=${siteId}&all=true`);
      if (res.ok) {
        const data = await res.json();
        setCitations(data.data?.citations || []);
      }
    } catch (err) {
      console.error("Failed to load citations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter citations
  const filtered = citations.filter(c => {
    if (platformFilter !== "all" && c.platform !== platformFilter) return false;
    if (searchQuery && !c.query.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: citations.length,
    perplexity: citations.filter(c => c.platform === "perplexity").length,
    google_aio: citations.filter(c => c.platform === "google_aio").length,
    chatgpt: citations.filter(c => c.platform === "chatgpt").length,
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Platform", "Query", "Snippet", "Confidence", "Date"];
    const rows = filtered.map(c => [
      platforms[c.platform]?.name || c.platform,
      `"${c.query.replace(/"/g, '""')}"`,
      `"${(c.snippet || "").replace(/"/g, '""')}"`,
      c.confidence,
      new Date(c.cited_at).toLocaleDateString(),
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
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">All Citations</h1>
            <p className="text-sm text-zinc-500">AI mentions of {site?.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-white/10 text-zinc-400">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => site && loadCitations(site.id)} className="bg-emerald-600 hover:bg-emerald-500">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`p-4 rounded-xl border text-left transition-all ${
            platformFilter === "all" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#0a0a0f] border-white/5 hover:border-white/10"
          }`}
        >
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
        </button>

        {(Object.keys(platforms) as Array<keyof typeof platforms>).map((key) => {
          const p = platforms[key];
          const Icon = p.icon;
          const count = stats[key];
          
          return (
            <button
              key={key}
              onClick={() => setPlatformFilter(platformFilter === key ? "all" : key)}
              className={`p-4 rounded-xl border text-left transition-all ${
                platformFilter === key ? `${p.bg} border-white/20` : "bg-[#0a0a0f] border-white/5 hover:border-white/10"
              }`}
            >
              <p className={`text-xs ${p.color} flex items-center gap-1 mb-1`}>
                <Icon className="w-3 h-3" /> {p.name}
              </p>
              <p className="text-2xl font-bold text-white font-mono">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search queries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-11 bg-[#0a0a0f] border-white/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Citations List */}
      <Card className="bg-[#0a0a0f] border-white/5">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No citations found</h3>
              <p className="text-zinc-500">
                {citations.length === 0 ? "Run a check from the dashboard to find citations." : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((c) => {
                const p = platforms[c.platform];
                const Icon = p.icon;
                
                return (
                  <div key={c.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${p.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
                          <Badge variant="outline" className={`text-[10px] ${
                            c.confidence === "high" ? "border-emerald-500/30 text-emerald-400" :
                            c.confidence === "medium" ? "border-amber-500/30 text-amber-400" :
                            "border-zinc-500/30 text-zinc-400"
                          }`}>
                            {c.confidence}
                          </Badge>
                          <span className="text-xs text-zinc-600 ml-auto">
                            {new Date(c.cited_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white mb-2">"{c.query}"</p>
                        {c.snippet && (
                          <p className="text-sm text-zinc-500 italic line-clamp-2">{c.snippet}</p>
                        )}
                        {c.page_url && (
                          <a
                            href={c.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2"
                          >
                            <ExternalLink className="w-3 h-3" /> View source
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
