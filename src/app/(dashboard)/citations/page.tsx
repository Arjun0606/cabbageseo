"use client";

/**
 * Citations Page - All AI mentions
 * 
 * Shows:
 * - List of all citations for current site
 * - Filter by platform
 * - Export to CSV
 */

import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  RefreshCw,
  ExternalLink,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Citation {
  id: string;
  platform: string;
  query: string;
  snippet?: string;
  pageUrl?: string;
  confidence: number;
  discoveredAt: string;
}

export default function CitationsPage() {
  const { currentSite, loading } = useSite();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loadingCitations, setLoadingCitations] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // Fetch citations
  useEffect(() => {
    if (!currentSite) return;
    
    const fetchCitations = async () => {
      setLoadingCitations(true);
      try {
        const res = await fetch(`/api/geo/citations?siteId=${currentSite.id}`);
        const result = await res.json();
        if (result.citations) {
          setCitations(result.citations);
        }
      } catch (err) {
        console.error("Failed to fetch citations:", err);
      } finally {
        setLoadingCitations(false);
      }
    };

    fetchCitations();
  }, [currentSite]);

  // Filter citations
  const filteredCitations = filter === "all" 
    ? citations 
    : citations.filter(c => c.platform === filter);

  // Export to CSV
  const exportCSV = () => {
    if (citations.length === 0) return;
    
    const headers = ["Platform", "Query", "Snippet", "Confidence", "Discovered"];
    const rows = citations.map(c => [
      c.platform,
      c.query,
      c.snippet || "",
      (c.confidence * 100).toFixed(0) + "%",
      new Date(c.discoveredAt).toLocaleDateString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `citations-${currentSite?.domain}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Platform badge color
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "perplexity": return "bg-emerald-500/20 text-emerald-400";
      case "google_aio": return "bg-blue-500/20 text-blue-400";
      case "chatgpt": return "bg-violet-500/20 text-violet-400";
      default: return "bg-zinc-500/20 text-zinc-400";
    }
  };

  const formatPlatform = (platform: string) => {
    switch (platform) {
      case "perplexity": return "Perplexity";
      case "google_aio": return "Google AI";
      case "chatgpt": return "ChatGPT";
      default: return platform;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">Add a site first to see citations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Citations</h1>
          <p className="text-sm text-zinc-500">
            All AI mentions of {currentSite.domain}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={exportCSV}
            disabled={citations.length === 0}
            variant="outline"
            className="border-zinc-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{citations.length}</div>
            <p className="text-sm text-zinc-500">Total Citations</p>
          </CardContent>
        </Card>
        {["perplexity", "google_aio", "chatgpt"].map(platform => (
          <Card key={platform} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-white">
                {citations.filter(c => c.platform === platform).length}
              </div>
              <p className="text-sm text-zinc-500">{formatPlatform(platform)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500" />
        {["all", "perplexity", "google_aio", "chatgpt"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === f 
                ? "bg-emerald-500 text-black" 
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {f === "all" ? "All" : formatPlatform(f)}
          </button>
        ))}
      </div>

      {/* Citations list */}
      {loadingCitations ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : filteredCitations.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No citations yet</h3>
            <p className="text-zinc-500 mb-4">
              Run a check to discover AI mentions of your site
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCitations.map((citation) => (
            <Card key={citation.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPlatformColor(citation.platform)}>
                        {formatPlatform(citation.platform)}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {(citation.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-white font-medium mb-1">{citation.query}</p>
                    {citation.snippet && (
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {citation.snippet}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-zinc-500">
                      {new Date(citation.discoveredAt).toLocaleDateString()}
                    </span>
                    {citation.pageUrl && (
                      <a 
                        href={citation.pageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
