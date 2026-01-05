"use client";

/**
 * ============================================
 * CITATIONS PAGE - All Citations List
 * ============================================
 * 
 * Shows all citations with:
 * - Filtering by platform
 * - Search
 * - Export to CSV
 */

import { useState, useEffect } from "react";
import {
  Loader2,
  Search,
  Bot,
  Sparkles,
  Eye,
  Download,
  Filter,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSite } from "@/context/site-context";

// Platform config
const platformConfig = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface Citation {
  id: string;
  platform: "perplexity" | "google_aio" | "chatgpt";
  query: string;
  snippet: string;
  page_url?: string;
  confidence: number;
  discovered_at: string;
}

export default function CitationsPage() {
  const { currentSite, loading: siteLoading } = useSite();
  
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Load citations
  useEffect(() => {
    async function loadCitations() {
      if (!currentSite?.id) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/geo/citations?siteId=${currentSite.id}&full=true`);
        if (res.ok) {
          const data = await res.json();
          setCitations(data.data?.citations || data.data?.recent || []);
        }
      } catch (err) {
        console.error("Failed to load citations:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadCitations();
  }, [currentSite?.id]);

  // Filter citations
  const filteredCitations = citations.filter((c) => {
    const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchesSearch = !searchQuery || 
      c.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.snippet?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Date", "Platform", "Query", "Snippet", "Confidence"];
    const rows = filteredCitations.map((c) => [
      new Date(c.discovered_at).toLocaleDateString(),
      platformConfig[c.platform]?.name || c.platform,
      `"${c.query.replace(/"/g, '""')}"`,
      `"${(c.snippet || "").replace(/"/g, '""')}"`,
      c.confidence,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations-${currentSite?.domain}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (siteLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500">Loading citations...</p>
        </div>
      </div>
    );
  }

  // No site
  if (!currentSite) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Site Selected</h2>
          <p className="text-zinc-400">Add a website from the Dashboard to see citations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Citations</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {filteredCitations.length} citation{filteredCitations.length !== 1 ? "s" : ""} for {currentSite.domain}
          </p>
        </div>
        <Button
          onClick={exportCSV}
          variant="outline"
          disabled={filteredCitations.length === 0}
          className="border-zinc-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search citations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800">
            <Filter className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="perplexity">Perplexity</SelectItem>
            <SelectItem value="google_aio">Google AI</SelectItem>
            <SelectItem value="chatgpt">ChatGPT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Citations List */}
      {filteredCitations.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Citations Found</h3>
            <p className="text-zinc-500">
              {citations.length === 0 
                ? "Run a check from the Dashboard to find citations."
                : "No citations match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCitations.map((citation) => {
            const platform = platformConfig[citation.platform];
            const Icon = platform?.icon || Search;
            const confidencePercent = Math.round(citation.confidence * 100);
            
            return (
              <Card key={citation.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${platform?.bg || "bg-zinc-800"} shrink-0`}>
                      <Icon className={`w-5 h-5 ${platform?.color || "text-zinc-400"}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">"{citation.query}"</p>
                          {citation.snippet && (
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{citation.snippet}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={`shrink-0 ${
                          confidencePercent >= 80 ? "border-emerald-500/30 text-emerald-400" :
                          confidencePercent >= 50 ? "border-yellow-500/30 text-yellow-400" :
                          "border-zinc-700 text-zinc-500"
                        }`}>
                          {confidencePercent}% confidence
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            citation.platform === "perplexity" ? "bg-violet-500" :
                            citation.platform === "google_aio" ? "bg-blue-500" :
                            "bg-emerald-500"
                          }`} />
                          {platform?.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(citation.discovered_at).toLocaleDateString()}
                        </div>
                        {citation.page_url && (
                          <a 
                            href={citation.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
