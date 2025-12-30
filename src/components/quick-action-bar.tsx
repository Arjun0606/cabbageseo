"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Search,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Lightbulb,
  XCircle,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSite } from "@/contexts/site-context";

// ============================================
// TYPES
// ============================================

type ResultType = "progress" | "score" | "issue" | "content" | "success" | "error";

interface StreamingResult {
  type: ResultType;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================
// QUICK ACTION BAR - Always visible input
// ============================================

export function QuickActionBar() {
  const router = useRouter();
  const { refreshSites } = useSite();
  
  const [value, setValue] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [results, setResults] = React.useState<StreamingResult[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Detect if input looks like a URL
  const isUrl = React.useMemo(() => {
    const v = value.trim().toLowerCase();
    return v.includes(".") && (v.includes("http") || !v.includes(" ") || v.match(/\.[a-z]{2,}/));
  }, [value]);

  // Add result
  const addResult = (type: ResultType, message: string, data?: Record<string, unknown>) => {
    setResults(prev => [...prev, { type, message, data }]);
  };

  // Analyze URL
  const analyzeUrl = async (url: string) => {
    setIsProcessing(true);
    setShowResults(true);
    setResults([]);

    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith("http")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      const domain = new URL(cleanUrl).hostname.replace("www.", "");

      addResult("progress", `Analyzing ${domain}...`);

      const response = await fetch("/api/onboarding/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();

      if (data.data) {
        const analysis = data.data;

        addResult("score", `SEO: ${analysis.seoScore}/100 | GEO: ${analysis.aioScore}/100`);

        if (analysis.issues) {
          const total = analysis.issues.critical + analysis.issues.warnings;
          if (total > 0) {
            addResult("issue", `${analysis.issues.critical} critical, ${analysis.issues.warnings} warnings found`);
          }
        }

        if (analysis.quickWins?.length > 0) {
          addResult("content", `${analysis.quickWins.length} quick wins to improve rankings`);
        }

        addResult("success", "Analysis complete!", { siteId: analysis.siteId });
        refreshSites();
      }
    } catch (error) {
      addResult("error", error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate content ideas
  const generateIdeas = async (topic: string) => {
    setIsProcessing(true);
    setShowResults(true);
    setResults([]);

    try {
      addResult("progress", `Researching "${topic}"...`);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ideas", topic, options: { count: 3 } }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();

      if (data.data) {
        const ideas = Array.isArray(data.data) ? data.data : data.data.ideas || [];
        
        ideas.slice(0, 3).forEach((idea: { title: string; keyword?: string }) => {
          addResult("content", idea.title, { keyword: idea.keyword || topic });
        });

        addResult("success", "Click any idea to write article");
      }
    } catch (error) {
      addResult("error", error instanceof Error ? error.message : "Failed to generate ideas");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || isProcessing) return;

    if (isUrl) {
      await analyzeUrl(v);
    } else if (v.length > 2) {
      await generateIdeas(v);
    }
  };

  // Handle result click
  const handleResultClick = (result: StreamingResult) => {
    if (result.type === "success" && result.data?.siteId) {
      router.push(`/sites/${result.data.siteId}/strategy`);
    } else if (result.type === "content" && result.data?.keyword) {
      router.push(`/content/new?keyword=${encodeURIComponent(String(result.data.keyword))}`);
    } else if (result.type === "issue") {
      router.push("/audit");
    }
  };

  // Export results as markdown
  const exportResults = () => {
    const markdown = results
      .filter(r => r.type !== "progress")
      .map(r => {
        if (r.type === "score") return `## Scores\n${r.message}`;
        if (r.type === "issue") return `## Issues\n- ${r.message}`;
        if (r.type === "content") return `- ${r.message}`;
        return "";
      })
      .join("\n\n");

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset
  const reset = () => {
    setValue("");
    setShowResults(false);
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-emerald-500/50 transition-colors">
          {isUrl ? (
            <Globe className="w-5 h-5 text-emerald-500 ml-2" />
          ) : (
            <Search className="w-5 h-5 text-zinc-500 ml-2" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste website URL or enter topic to analyze..."
            className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-zinc-500 text-sm py-2"
            disabled={isProcessing}
          />
          {value && !isProcessing && (
            <Badge variant="secondary" className="text-xs mr-1">
              {isUrl ? "URL" : "Topic"} → Enter
            </Badge>
          )}
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mr-2" />}
          {!isProcessing && value && (
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500">
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
          {results.map((result, i) => (
            <div
              key={i}
              onClick={() => handleResultClick(result)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                result.type === "progress" && "bg-zinc-800/50",
                result.type === "score" && "bg-blue-500/10",
                result.type === "issue" && "bg-yellow-500/10 cursor-pointer hover:bg-yellow-500/20",
                result.type === "content" && "bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20",
                result.type === "success" && "bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20",
                result.type === "error" && "bg-red-500/10",
              )}
            >
              {result.type === "progress" && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
              {result.type === "score" && <TrendingUp className="w-4 h-4 text-blue-500" />}
              {result.type === "issue" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              {result.type === "content" && <Lightbulb className="w-4 h-4 text-emerald-500" />}
              {result.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {result.type === "error" && <XCircle className="w-4 h-4 text-red-500" />}
              
              <span className={cn(
                "flex-1 text-sm",
                result.type === "success" && "font-medium text-emerald-400",
              )}>
                {result.message}
              </span>

              {(result.type === "content" || result.type === "issue" || result.type === "success") && (
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              )}
            </div>
          ))}

          {/* Actions */}
          {!isProcessing && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <Button variant="outline" size="sm" onClick={reset}>
                New Search
              </Button>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Copy className="w-3 h-3 mr-1" />
                {copied ? "Copied!" : "Export"}
              </Button>
              {results.some(r => r.type === "success" && r.data?.siteId) && (
                <Button
                  size="sm"
                  className="ml-auto bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => {
                    const r = results.find(r => r.type === "success" && r.data?.siteId);
                    if (r?.data?.siteId) router.push(`/sites/${r.data.siteId}/strategy`);
                  }}
                >
                  View Full Report
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuickActionBar;

