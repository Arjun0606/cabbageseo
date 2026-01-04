"use client";

/**
 * ============================================
 * CITATION ANALYZER PAGE
 * ============================================
 * 
 * Quick check: Enter any URL/domain to see if AI platforms cite it.
 */

import { useState } from "react";
import {
  Loader2,
  Search,
  Bot,
  Sparkles,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PlatformResult {
  cited: boolean;
  count: number;
  snippets: string[];
}

interface AnalysisResult {
  domain: string;
  perplexity: PlatformResult;
  googleAI: PlatformResult;
  chatgpt: PlatformResult;
  totalCitations: number;
}

const platformConfig = {
  perplexity: {
    name: "Perplexity",
    icon: Search,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  googleAI: {
    name: "Google AI",
    icon: Sparkles,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  chatgpt: {
    name: "ChatGPT",
    icon: Bot,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
};

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) return;
    
    // Clean domain
    let domain = url.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      // Create a temporary site for analysis
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!siteRes.ok) {
        throw new Error("Failed to analyze domain");
      }

      const siteData = await siteRes.json();
      const siteId = siteData.site?.id;

      if (!siteId) {
        throw new Error("Failed to create site for analysis");
      }

      // Run citation check
      const checkRes = await fetch("/api/geo/citations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain }),
      });

      if (!checkRes.ok) {
        throw new Error("Citation check failed");
      }

      const checkData = await checkRes.json();

      setResult({
        domain,
        perplexity: {
          cited: checkData.results?.perplexity?.cited || false,
          count: checkData.results?.perplexity?.count || 0,
          snippets: [],
        },
        googleAI: {
          cited: checkData.results?.googleAI?.cited || false,
          count: checkData.results?.googleAI?.count || 0,
          snippets: [],
        },
        chatgpt: {
          cited: checkData.results?.chatgpt?.cited || false,
          count: checkData.results?.chatgpt?.count || 0,
          snippets: [],
        },
        totalCitations: checkData.totalNewCitations || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
          <Search className="w-7 h-7 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Citation Analyzer</h1>
        <p className="text-zinc-400">
          Check if AI platforms are citing any domain
        </p>
      </div>

      {/* Search Box */}
      <Card className="bg-[#0a0a0f] border-white/5">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <Input
                placeholder="Enter any domain (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !analyzing && analyze()}
                className="pl-12 h-14 text-lg bg-white/5 border-white/10 focus:border-violet-500/50"
              />
            </div>
            <Button
              onClick={analyze}
              disabled={analyzing || !url.trim()}
              className="h-14 px-8 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{result.domain}</h2>
                  <p className="text-zinc-400">
                    {result.totalCitations > 0 
                      ? `Found ${result.totalCitations} citation${result.totalCitations !== 1 ? "s" : ""} across AI platforms`
                      : "No citations found yet"
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold font-mono text-violet-400">
                    {result.totalCitations}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Citations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {(["perplexity", "googleAI", "chatgpt"] as const).map((platform) => {
              const config = platformConfig[platform];
              const Icon = config.icon;
              const data = result[platform];
              
              return (
                <Card key={platform} className="bg-[#0a0a0f] border-white/5">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${config.color}`}>{config.name}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {data.cited ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400">Cited</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-zinc-500" />
                            <span className="text-zinc-500">Not cited</span>
                          </>
                        )}
                      </div>
                      <Badge variant="outline" className="border-white/10 text-zinc-400 font-mono">
                        {data.count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          {result.totalCitations === 0 && (
            <Card className="bg-[#0a0a0f] border-white/5">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium text-white mb-2">
                  Want to improve your AI visibility?
                </h3>
                <p className="text-zinc-400 mb-4 max-w-lg mx-auto">
                  Getting cited by AI platforms like ChatGPT and Perplexity requires optimized content structure, clear expertise signals, and proper schema markup.
                </p>
                <Button className="bg-emerald-600 hover:bg-emerald-500">
                  Learn How to Get Cited
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!result && !analyzing && (
        <div className="text-center py-12">
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {(["perplexity", "googleAI", "chatgpt"] as const).map((platform) => {
              const config = platformConfig[platform];
              const Icon = config.icon;
              
              return (
                <div key={platform} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <p className={`text-sm font-medium ${config.color}`}>{config.name}</p>
                </div>
              );
            })}
          </div>
          <p className="text-zinc-500 mt-6 text-sm">
            We check these AI platforms for citations
          </p>
        </div>
      )}
    </div>
  );
}

