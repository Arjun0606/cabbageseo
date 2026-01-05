"use client";

/**
 * ============================================
 * ANALYZE PAGE - Quick Domain Analysis
 * ============================================
 * 
 * Quick tool to check any domain's AI citations
 */

import { useState } from "react";
import {
  Loader2,
  Search,
  Bot,
  Sparkles,
  Globe,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSite } from "@/context/site-context";

// Platform config
const platformConfig = {
  perplexity: { name: "Perplexity", icon: Search, color: "text-violet-400", bg: "bg-violet-500/10" },
  google_aio: { name: "Google AI", icon: Sparkles, color: "text-blue-400", bg: "bg-blue-500/10" },
  chatgpt: { name: "ChatGPT", icon: Bot, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface AnalysisResult {
  platform: string;
  cited: boolean;
  query: string;
  snippet?: string;
  confidence?: number;
  error?: string;
}

export default function AnalyzePage() {
  const { usage } = useSite();
  
  const [domain, setDomain] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[] | null>(null);
  const [analyzedDomain, setAnalyzedDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = usage.checksUsed < usage.checksLimit;

  const handleAnalyze = async () => {
    if (!domain.trim()) return;
    
    setAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      // Clean domain
      let cleanDomain = domain.trim().toLowerCase();
      cleanDomain = cleanDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
      
      setAnalyzedDomain(cleanDomain);
      
      const res = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanDomain, quick: true }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        const data = await res.json();
        setError(data.error || "Analysis failed");
      }
    } catch (err) {
      setError("Failed to analyze. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const citedCount = results?.filter(r => r.cited).length || 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Quick Analysis</h1>
        <p className="text-zinc-500 mt-1">
          Check if any domain is being cited by AI platforms
        </p>
      </div>

      {/* Search Form */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAnalyze && handleAnalyze()}
                disabled={analyzing}
                className="pl-10 h-12 bg-zinc-800 border-zinc-700"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !domain.trim() || !canAnalyze}
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Analyze</>
              )}
            </Button>
          </div>
          
          {!canAnalyze && (
            <p className="text-sm text-amber-400 mt-3">
              You&apos;ve reached your check limit. Upgrade for more.
            </p>
          )}
          
          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className={`border-2 ${
            citedCount > 0 ? "bg-emerald-500/5 border-emerald-500/30" : "bg-zinc-900/50 border-zinc-800"
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {citedCount > 0 ? (
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-zinc-500" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {analyzedDomain}
                  </h2>
                  <p className={`text-sm ${citedCount > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                    {citedCount > 0 
                      ? `Found on ${citedCount} AI platform${citedCount > 1 ? "s" : ""}!` 
                      : "Not found on any AI platforms"}
                  </p>
                </div>
                <a
                  href={`https://${analyzedDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-zinc-500 hover:text-white"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Platform Results */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Platform Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, i) => {
                  const platform = platformConfig[result.platform as keyof typeof platformConfig];
                  const Icon = platform?.icon || Search;
                  
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border ${
                        result.cited 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-zinc-800/50 border-zinc-700/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${platform?.bg || "bg-zinc-800"}`}>
                          <Icon className={`w-5 h-5 ${platform?.color || "text-zinc-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-white">{platform?.name || result.platform}</span>
                            {result.cited ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Cited
                              </Badge>
                            ) : (
                              <Badge className="bg-zinc-800 text-zinc-500 border-0">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Found
                              </Badge>
                            )}
                          </div>
                          
                          {result.query && (
                            <p className="text-sm text-zinc-400 mt-1">
                              Query: "{result.query}"
                            </p>
                          )}
                          
                          {result.snippet && (
                            <p className="text-sm text-zinc-500 mt-2 p-3 bg-black/20 rounded-lg">
                              {result.snippet}
                            </p>
                          )}
                          
                          {result.error && (
                            <p className="text-sm text-red-400 mt-1">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!results && !analyzing && (
        <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Check Any Domain</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Enter a domain above to see if it&apos;s being cited by ChatGPT, Perplexity, or Google AI.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
