"use client";

/**
 * GET FIXES PAGE - One-Click Content Fixes
 * 
 * For every query you're losing, generate:
 * - Page title
 * - Sections/headings
 * - Entities to include
 * - Comparison blocks
 * - FAQs
 */

import { useState, useEffect } from "react";
import { 
  Zap, 
  RefreshCw,
  AlertCircle,
  Lock,
  FileText,
  Users,
  Crown,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Target,
  Lightbulb,
  List,
  MessageSquare
} from "lucide-react";
import { useSite } from "@/context/site-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface ContentFix {
  pageTitle: string;
  targetQuery: string;
  sections: Array<{
    heading: string;
    description: string;
    entities: string[];
  }>;
  comparisons: string[];
  faqs: string[];
  estimatedImpact: number;
}

interface GapAnalysisResult {
  whyNotYou: string[];
  missingElements: string[];
  actionItems: string[];
}

export default function IntelligencePage() {
  const searchParams = useSearchParams();
  const { currentSite, organization, loading } = useSite();
  
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [generatingFix, setGeneratingFix] = useState(false);
  const [fix, setFix] = useState<ContentFix | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(null);
  const [loadingGap, setLoadingGap] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | string>("∞");

  const plan = organization?.plan || "free";
  const isPaid = plan !== "free";
  const isPro = plan === "pro";

  // Check for query param from dashboard
  useEffect(() => {
    const fixQuery = searchParams.get("fix");
    if (fixQuery) {
      setSelectedQuery(decodeURIComponent(fixQuery));
    }
  }, [searchParams]);

  // Sample lost queries (in production, these come from the check results)
  const lostQueries = [
    { query: "best project management tools", competitors: ["Notion", "ClickUp"], value: 3200 },
    { query: "productivity apps for startups", competitors: ["Asana", "Todoist"], value: 2800 },
    { query: "notion alternatives 2025", competitors: ["Coda", "Obsidian"], value: 2400 },
  ];

  // Generate "Why Not Me?" analysis
  const generateGapAnalysis = async (query: string) => {
    if (!isPaid) return;
    
    setLoadingGap(true);
    setSelectedQuery(query);
    
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gap-analysis",
          siteId: currentSite?.id,
          query,
        }),
      });
      
      const data = await res.json();
      if (data.result) {
        setGapAnalysis(data.result);
        }
      } catch (err) {
      console.error("Gap analysis failed:", err);
      } finally {
      setLoadingGap(false);
      }
    };

  // Generate content fix
  const generateContentFix = async (query: string) => {
    if (!isPaid) return;

    setGeneratingFix(true);
    setSelectedQuery(query);
    
    try {
      const res = await fetch("/api/geo/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "content-recommendations",
          siteId: currentSite?.id,
          query,
        }),
      });
      
      const data = await res.json();
      if (data.result) {
        // Transform API result to ContentFix format
        const recommendations = data.result.recommendations || [];
        if (recommendations.length > 0) {
          const rec = recommendations[0];
          setFix({
            pageTitle: rec.title || `Guide to ${query}`,
            targetQuery: query,
            sections: [
              { heading: "Quick Answer", description: "Direct response with your product", entities: ["your brand", "key feature"] },
              { heading: "Detailed Comparison", description: "Compare with top competitors", entities: rec.targetQueries || [] },
              { heading: "Why Choose You", description: "Your unique value proposition", entities: ["differentiator", "results"] },
              { heading: "Pricing & Value", description: "Transparent pricing breakdown", entities: ["plans", "features"] },
            ],
            comparisons: rec.targetQueries?.map((q: string) => `${q} comparison`) || [],
            faqs: [
              `What is the best ${query.replace("best ", "")}?`,
              `How do I choose a ${query.replace("best ", "")}?`,
            ],
            estimatedImpact: 2500,
          });
        }
      }
    } catch (err) {
      console.error("Content fix failed:", err);
    } finally {
      setGeneratingFix(false);
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
          <p className="text-zinc-400">Add a site first to get content fixes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div>
        <h1 className="text-2xl font-bold text-white">Get Fixes</h1>
          <p className="text-sm text-zinc-500">
          One-click content plans to win back lost queries
        </p>
      </div>

      {/* Paywall for free users */}
      {!isPaid && (
        <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-emerald-400" />
        </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Unlock Content Fixes
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Stop guessing what to write. Get exact content plans for every query you&apos;re losing.
            </p>
            <Link href="/settings/billing">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Upgrade to Starter — $29/mo
                <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Queries You're Losing */}
      {isPaid && (
        <>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                Queries You&apos;re Losing
              </CardTitle>
              <CardDescription>
                Select a query to generate a content fix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lostQueries.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedQuery === item.query 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-zinc-800/50 hover:bg-zinc-800"
                    }`}
                    onClick={() => setSelectedQuery(item.query)}
                  >
                    <div>
                      <p className="text-white font-medium">&ldquo;{item.query}&rdquo;</p>
                      <p className="text-sm text-zinc-500">
                        AI recommends: {item.competitors.join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-medium">-${item.value}/mo</p>
                      <p className="text-xs text-zinc-500">Est. loss</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {selectedQuery && (
            <div className="flex gap-3">
              <Button
                onClick={() => generateGapAnalysis(selectedQuery)}
                disabled={loadingGap}
                variant="outline"
                className="border-zinc-700"
              >
                {loadingGap ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                Why Am I Losing?
              </Button>
              <Button
                onClick={() => generateContentFix(selectedQuery)}
                disabled={generatingFix}
                className="bg-emerald-500 hover:bg-emerald-400 text-black"
              >
                {generatingFix ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Generate Fix
              </Button>
            </div>
          )}

          {/* Gap Analysis Result */}
          {gapAnalysis && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Why You&apos;re Losing: &ldquo;{selectedQuery}&rdquo;
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">What competitors have that you don&apos;t:</h4>
                  <ul className="space-y-1">
                    {gapAnalysis.missingElements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white">
                        <span className="text-red-400">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">What to do:</h4>
                  <ul className="space-y-1">
                    {gapAnalysis.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white">
                        <span className="text-emerald-400">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Fix Result */}
          {fix && (
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Content Fix: &ldquo;{fix.targetQuery}&rdquo;
                </CardTitle>
                <CardDescription>
                  Estimated impact: +${fix.estimatedImpact}/mo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Page Title */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Recommended Page Title
                  </h4>
                  <p className="text-lg text-white font-medium bg-zinc-800/50 p-3 rounded-lg">
                    {fix.pageTitle}
                  </p>
                </div>

                {/* Sections */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Page Sections
                  </h4>
                  <div className="space-y-2">
                    {fix.sections.map((section, idx) => (
                      <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-emerald-400 font-medium">H2:</span>
                          <span className="text-white">{section.heading}</span>
                        </div>
                        <p className="text-sm text-zinc-400">{section.description}</p>
                        {section.entities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {section.entities.map((entity, i) => (
                              <Badge key={i} className="bg-zinc-700 text-zinc-300 text-xs">
                                {entity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison Blocks */}
                {fix.comparisons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Comparison Blocks to Add
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fix.comparisons.map((comp, idx) => (
                        <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg text-sm text-white">
                          {comp}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs */}
                {fix.faqs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      FAQs to Include
                    </h4>
                    <div className="space-y-2">
                      {fix.faqs.map((faq, idx) => (
                        <div key={idx} className="bg-zinc-800/50 p-3 rounded-lg text-sm text-white">
                          Q: {faq}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pro Upgrade for Weekly Playbook */}
          {!isPro && (
            <Card className="bg-gradient-to-br from-violet-500/10 to-zinc-900 border-violet-500/30">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Crown className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Weekly Action Playbook
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Get a prioritized to-do list every week based on what you&apos;re losing and what to fix first.
                    </p>
                  </div>
                <Link href="/settings/billing">
                    <Button className="bg-violet-500 hover:bg-violet-400 text-white">
                      Upgrade to Pro
                  </Button>
                </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
