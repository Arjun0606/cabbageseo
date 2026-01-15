"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  ExternalLink,
  Loader2,
  Lock,
  AlertTriangle,
  Globe,
  Star,
  Users,
  MessageSquare,
} from "lucide-react";

interface TrustSource {
  name: string;
  domain: string;
  icon: string;
  description: string;
  importance: "critical" | "high" | "medium";
  competitorsListed: string[];
  youListed: boolean;
  profileUrl?: string;
  howToGetListed: string[];
  timeToList: string;
}

// Known trusted sources that AI platforms use
const TRUST_SOURCES: Omit<TrustSource, "competitorsListed" | "youListed" | "profileUrl">[] = [
  {
    name: "G2",
    domain: "g2.com",
    icon: "🏆",
    description: "Software reviews and ratings platform",
    importance: "critical",
    howToGetListed: [
      "Create a free G2 seller account",
      "Claim your product listing",
      "Add product details and screenshots",
      "Invite customers to leave reviews",
    ],
    timeToList: "2-3 hours",
  },
  {
    name: "Capterra",
    domain: "capterra.com",
    icon: "📊",
    description: "Business software comparison platform",
    importance: "critical",
    howToGetListed: [
      "Create a Capterra vendor account",
      "Submit your product for review",
      "Complete your product profile",
      "Gather customer reviews",
    ],
    timeToList: "2-3 hours",
  },
  {
    name: "Product Hunt",
    domain: "producthunt.com",
    icon: "🚀",
    description: "Product discovery and launch platform",
    importance: "high",
    howToGetListed: [
      "Create a Product Hunt account",
      "Prepare launch assets (images, tagline)",
      "Schedule your launch day",
      "Engage with the community",
    ],
    timeToList: "1-2 hours",
  },
  {
    name: "Reddit",
    domain: "reddit.com",
    icon: "💬",
    description: "Community discussions and recommendations",
    importance: "high",
    howToGetListed: [
      "Find relevant subreddits",
      "Participate in discussions genuinely",
      "Share when contextually relevant",
      "Build community presence",
    ],
    timeToList: "Ongoing",
  },
  {
    name: "Trustpilot",
    domain: "trustpilot.com",
    icon: "⭐",
    description: "Consumer review platform",
    importance: "medium",
    howToGetListed: [
      "Claim your business profile",
      "Verify your business",
      "Invite customers to review",
      "Respond to reviews",
    ],
    timeToList: "1-2 hours",
  },
  {
    name: "TrustRadius",
    domain: "trustradius.com",
    icon: "🎯",
    description: "B2B software reviews",
    importance: "medium",
    howToGetListed: [
      "Create vendor profile",
      "Add product information",
      "Invite verified buyers to review",
      "Engage with reviewers",
    ],
    timeToList: "2-3 hours",
  },
];

export default function SourcesPage() {
  const { currentSite, organization } = useSite();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<TrustSource[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const isPaidPlan = organization?.plan === "starter" || organization?.plan === "pro";
  const isProPlan = organization?.plan === "pro";

  useEffect(() => {
    // Simulate loading sources data
    setTimeout(() => {
      // For demo, show sources with mock competitor data
      const mockSources: TrustSource[] = TRUST_SOURCES.map(source => ({
        ...source,
        competitorsListed: ["notion.so", "clickup.com", "asana.com"].slice(0, Math.floor(Math.random() * 3) + 1),
        youListed: false,
      }));
      setSources(mockSources);
      setLoading(false);
    }, 1000);
  }, [currentSite?.id]);

  const sourcesWithCompetitors = sources.filter(s => s.competitorsListed.length > 0);
  const sourcesYouNeed = sources.filter(s => s.competitorsListed.length > 0 && !s.youListed);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Mapping trusted sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Trust Map
          </h1>
          <p className="text-xl text-zinc-400">
            These are the sources AI uses to make recommendations. 
            Your competitors are on them. You're not.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Globe className="w-4 h-4" />
              Total Sources
            </div>
            <div className="text-4xl font-bold text-white">
              {sources.length}
            </div>
          </div>

          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              You're Missing
            </div>
            <div className="text-4xl font-bold text-red-400">
              {sourcesYouNeed.length}
            </div>
          </div>

          <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
              <Check className="w-4 h-4" />
              You're Listed
            </div>
            <div className="text-4xl font-bold text-emerald-400">
              {sources.filter(s => s.youListed).length}
            </div>
          </div>
        </div>

        {/* Critical sources */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">
              Critical: You must be on these
            </h2>
          </div>

          <div className="space-y-4">
            {sources
              .filter(s => s.importance === "critical")
              .map((source, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedSource(
                      expandedSource === source.name ? null : source.name
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{source.icon}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">
                              {source.name}
                            </h3>
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                              Critical
                            </span>
                          </div>
                          <p className="text-zinc-400 text-sm mb-2">
                            {source.description}
                          </p>
                          
                          {/* Competitor vs You */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check className="w-4 h-4" />
                              Competitors: {source.competitorsListed.length}
                            </span>
                            <span className={`flex items-center gap-1 ${
                              source.youListed ? "text-emerald-400" : "text-red-400"
                            }`}>
                              {source.youListed ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              You: {source.youListed ? "Listed" : "Not listed"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-5 h-5 text-zinc-400 transition-transform ${
                          expandedSource === source.name ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded content - How to get listed */}
                  {expandedSource === source.name && (
                    <div className="border-t border-zinc-800 p-6 bg-zinc-950/50">
                      {isPaidPlan ? (
                        <>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-zinc-400">
                              Time to get listed: ~{source.timeToList}
                            </span>
                          </div>

                          <h4 className="font-medium text-white mb-3">
                            How to get listed:
                          </h4>
                          <ol className="space-y-2">
                            {source.howToGetListed.map((step, j) => (
                              <li key={j} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">
                                  {j + 1}
                                </span>
                                <span className="text-zinc-300">{step}</span>
                              </li>
                            ))}
                          </ol>

                          <a
                            href={`https://${source.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          >
                            Go to {source.name}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <Lock className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                          <p className="text-white font-medium mb-2">
                            Upgrade to see how to get listed
                          </p>
                          <p className="text-zinc-400 text-sm mb-4">
                            Get step-by-step instructions for each source
                          </p>
                          <Link
                            href="/settings/billing"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                          >
                            Upgrade to Starter
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Other sources */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Other trusted sources
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {sources
              .filter(s => s.importance !== "critical")
              .map((source, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{source.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{source.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          source.importance === "high"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-zinc-700 text-zinc-400"
                        }`}>
                          {source.importance}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-2">
                        {source.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400">
                          ✓ {source.competitorsListed.length} competitors
                        </span>
                        <span className={source.youListed ? "text-emerald-400" : "text-red-400"}>
                          {source.youListed ? "✓ You're listed" : "✗ You're not listed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-950/50 to-zinc-900 border border-emerald-500/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to become visible to AI?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Get your personalized roadmap with step-by-step instructions 
            to get listed on every source AI trusts.
          </p>
          <Link
            href="/dashboard/roadmap"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
          >
            Get my visibility roadmap
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

