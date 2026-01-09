"use client";

/**
 * AI Wins & Losses Page
 * 
 * Shows:
 * - Where you're winning (getting recommended)
 * - Where you're losing (competitors getting recommended)
 * - Revenue impact of each
 */

import { useState, useEffect } from "react";
import { 
  Search, 
  Download, 
  RefreshCw,
  ExternalLink,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
  const { currentSite, organization, loading } = useSite();
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loadingCitations, setLoadingCitations] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const isPaid = organization?.plan !== "free";

  // Fetch citations
  useEffect(() => {
    if (!currentSite) return;
    
    const fetchCitations = async () => {
      setLoadingCitations(true);
      try {
        const res = await fetch(`/api/geo/citations?siteId=${currentSite.id}&full=true`);
        const result = await res.json();
        if (result.data?.citations) {
          setCitations(result.data.citations);
        } else if (result.data?.recent) {
          setCitations(result.data.recent);
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

  // Calculate wins (citations with high confidence)
  const wins = citations.filter(c => c.confidence >= 0.7);
  const partialWins = citations.filter(c => c.confidence >= 0.4 && c.confidence < 0.7);

  // Estimate revenue based on query type
  const estimateQueryValue = (query: string): number => {
    const lowerQuery = query.toLowerCase();
    let baseValue = 1500;
    if (lowerQuery.includes("best")) baseValue = 3000;
    if (lowerQuery.includes("alternative")) baseValue = 2500;
    if (lowerQuery.includes("vs")) baseValue = 2000;
    if (lowerQuery.includes("review")) baseValue = 1800;
    return Math.round(baseValue / 100) * 100;
  };

  const totalRevenueWon = wins.reduce((sum, c) => sum + estimateQueryValue(c.query), 0);

  // Export to CSV
  const exportCSV = () => {
    if (citations.length === 0) return;
    
    const headers = ["Platform", "Query", "Status", "Est. Value", "Discovered"];
    const rows = citations.map(c => [
      formatPlatform(c.platform),
      c.query,
      c.confidence >= 0.7 ? "Win" : c.confidence >= 0.4 ? "Partial" : "Mentioned",
      "$" + estimateQueryValue(c.query),
      new Date(c.discoveredAt).toLocaleDateString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-wins-${currentSite?.domain}-${new Date().toISOString().split("T")[0]}.csv`;
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
          <p className="text-zinc-400">Add a site first to track wins & losses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Wins & Losses</h1>
          <p className="text-sm text-zinc-500">
            Where AI recommends {currentSite.domain}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPaid && (
            <Button 
              onClick={exportCSV}
              disabled={citations.length === 0}
              variant="outline"
              className="border-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-zinc-500">Wins</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{wins.length}</div>
            <p className="text-xs text-zinc-500 mt-1">High confidence recommendations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-zinc-500">Partial</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">{partialWins.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Mentioned but not primary</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-zinc-500">Est. Monthly Revenue Won</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${totalRevenueWon.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-zinc-400" />
              <span className="text-xs text-zinc-500">Total Tracked</span>
            </div>
            <div className="text-3xl font-bold text-white">{citations.length}</div>
          </CardContent>
        </Card>
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
            <h3 className="text-lg font-semibold text-white mb-2">No wins tracked yet</h3>
            <p className="text-zinc-500 mb-4">
              Run a check from the War Room to start tracking where AI recommends you
            </p>
            <Link href="/dashboard">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Go to War Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCitations.map((citation) => {
            const isWin = citation.confidence >= 0.7;
            const isPartial = citation.confidence >= 0.4 && citation.confidence < 0.7;
            const estimatedValue = estimateQueryValue(citation.query);
            
            return (
              <Card 
                key={citation.id} 
                className={`border ${
                  isWin 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : isPartial 
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {isWin ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isPartial ? (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Search className="w-4 h-4 text-zinc-400" />
                        )}
                        <Badge className={getPlatformColor(citation.platform)}>
                          {formatPlatform(citation.platform)}
                        </Badge>
                        <span className="text-xs text-emerald-400 font-medium">
                          +${estimatedValue}/mo
                        </span>
                      </div>
                      <p className="text-white font-medium mb-1">&ldquo;{citation.query}&rdquo;</p>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upsell for free users */}
      {!isPaid && citations.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              See where you&apos;re losing too
            </h3>
            <p className="text-zinc-400 mb-4">
              Upgrade to track competitors and see which queries they&apos;re winning that you could take.
            </p>
            <Link href="/settings/billing">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Upgrade to Starter — $29/mo
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
