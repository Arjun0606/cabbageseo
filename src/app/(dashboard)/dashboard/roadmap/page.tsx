"use client";

import { useState } from "react";
import Link from "next/link";
import { useSite } from "@/context/site-context";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  Lock,
  Star,
  FileText,
  MessageSquare,
  Globe,
  Zap,
} from "lucide-react";

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  timeEstimate: string;
  priority: "critical" | "high" | "medium";
  completed: boolean;
  steps: string[];
  link?: string;
  linkText?: string;
}

export default function RoadmapPage() {
  const { organization } = useSite();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const isPaidPlan = organization?.plan === "starter" || organization?.plan === "pro";
  const isProPlan = organization?.plan === "pro";

  const toggleStep = (id: string) => {
    const newSet = new Set(completedSteps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCompletedSteps(newSet);
  };

  const roadmapSteps: RoadmapStep[] = [
    {
      id: "g2",
      title: "Get listed on G2",
      description: "G2 is the #1 source AI platforms use for software recommendations",
      icon: <Star className="w-6 h-6" />,
      timeEstimate: "2-3 hours",
      priority: "critical",
      completed: completedSteps.has("g2"),
      steps: [
        "Create a G2 seller account at g2.com/sellers",
        "Claim or create your product listing",
        "Add product description, screenshots, and pricing",
        "Invite 5-10 customers to leave reviews",
        "Respond to reviews as they come in",
      ],
      link: "https://sell.g2.com",
      linkText: "Go to G2 Seller Portal",
    },
    {
      id: "capterra",
      title: "Get listed on Capterra",
      description: "Another critical source for software discovery by AI",
      icon: <Globe className="w-6 h-6" />,
      timeEstimate: "2-3 hours",
      priority: "critical",
      completed: completedSteps.has("capterra"),
      steps: [
        "Create a vendor account at vendors.capterra.com",
        "Submit your product for listing",
        "Complete your product profile with details",
        "Add screenshots and demo videos",
        "Request reviews from existing customers",
      ],
      link: "https://vendors.capterra.com",
      linkText: "Go to Capterra Vendors",
    },
    {
      id: "producthunt",
      title: "Launch on Product Hunt",
      description: "AI platforms frequently cite Product Hunt for new products",
      icon: <Zap className="w-6 h-6" />,
      timeEstimate: "1-2 hours",
      priority: "high",
      completed: completedSteps.has("producthunt"),
      steps: [
        "Create a Product Hunt account",
        "Prepare launch assets (1200x630 banner, tagline)",
        "Write a compelling product description",
        "Choose a Tuesday, Wednesday, or Thursday for launch",
        "Engage with upvoters and commenters",
      ],
      link: "https://www.producthunt.com/posts/new",
      linkText: "Create Product Hunt Post",
    },
    {
      id: "comparison",
      title: "Create comparison pages",
      description: "AI loves structured comparison content between alternatives",
      icon: <FileText className="w-6 h-6" />,
      timeEstimate: "30-60 min per page",
      priority: "high",
      completed: completedSteps.has("comparison"),
      steps: [
        "Identify your top 3-5 competitors",
        "Create a page: 'Your Product vs Competitor'",
        "Include feature comparison tables",
        "Add honest pros and cons",
        "Include pricing comparisons",
      ],
    },
    {
      id: "reddit",
      title: "Build Reddit presence",
      description: "Reddit discussions are frequently cited by AI platforms",
      icon: <MessageSquare className="w-6 h-6" />,
      timeEstimate: "Ongoing",
      priority: "medium",
      completed: completedSteps.has("reddit"),
      steps: [
        "Find 3-5 subreddits where your audience hangs out",
        "Participate genuinely in discussions (no spam!)",
        "Help people with advice and recommendations",
        "Share your product only when contextually relevant",
        "Build karma through helpful contributions",
      ],
      link: "https://www.reddit.com/subreddits",
      linkText: "Browse Subreddits",
    },
    {
      id: "schema",
      title: "Add Schema.org markup",
      description: "Structured data helps AI understand your product",
      icon: <FileText className="w-6 h-6" />,
      timeEstimate: "1-2 hours",
      priority: "medium",
      completed: completedSteps.has("schema"),
      steps: [
        "Add Organization schema to your homepage",
        "Add Product schema to product pages",
        "Add FAQPage schema to FAQ sections",
        "Add Review/AggregateRating schema if you have reviews",
        "Test with Google's Rich Results Test",
      ],
      link: "https://search.google.com/test/rich-results",
      linkText: "Test Schema Markup",
    },
  ];

  const criticalSteps = roadmapSteps.filter(s => s.priority === "critical");
  const highSteps = roadmapSteps.filter(s => s.priority === "high");
  const mediumSteps = roadmapSteps.filter(s => s.priority === "medium");

  const totalSteps = roadmapSteps.length;
  const completedCount = completedSteps.size;
  const progress = Math.round((completedCount / totalSteps) * 100);

  if (!isPaidPlan) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <Lock className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Your AI Visibility Roadmap
            </h2>
            <p className="text-zinc-400 mb-6">
              Upgrade to get your personalized step-by-step plan to make AI recommend you.
            </p>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              Upgrade to unlock
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
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
            Your AI Visibility Roadmap
          </h1>
          <p className="text-xl text-zinc-400">
            Follow these steps to make AI recommend your product.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Progress</span>
            <span className="text-emerald-400">{completedCount}/{totalSteps} completed</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Critical steps */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 text-sm font-medium rounded-full">
              Critical
            </span>
            <span className="text-zinc-400">Do these first</span>
          </div>

          <div className="space-y-4">
            {criticalSteps.map(step => (
              <RoadmapStepCard
                key={step.id}
                step={step}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </div>
        </div>

        {/* High priority steps */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-sm font-medium rounded-full">
              High Priority
            </span>
            <span className="text-zinc-400">Do these next</span>
          </div>

          <div className="space-y-4">
            {highSteps.map(step => (
              <RoadmapStepCard
                key={step.id}
                step={step}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </div>
        </div>

        {/* Medium priority steps */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-zinc-700 text-zinc-300 text-sm font-medium rounded-full">
              Medium Priority
            </span>
            <span className="text-zinc-400">Extra visibility boost</span>
          </div>

          <div className="space-y-4">
            {mediumSteps.map(step => (
              <RoadmapStepCard
                key={step.id}
                step={step}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </div>
        </div>

        {/* Pro tip */}
        {isProPlan && (
          <div className="bg-gradient-to-r from-emerald-950/50 to-zinc-900 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Pro tip: Track your progress
            </h3>
            <p className="text-zinc-400">
              As you complete each step, we'll automatically track when AI starts 
              mentioning you more. Check your dashboard daily to see improvements!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RoadmapStepCard({ step, onToggle }: { step: RoadmapStep; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-zinc-900 border rounded-xl overflow-hidden transition-colors ${
        step.completed
          ? "border-emerald-500/20"
          : step.priority === "critical"
          ? "border-red-500/20"
          : "border-zinc-800"
      }`}
    >
      <div
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              step.completed
                ? "bg-emerald-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {step.completed ? <Check className="w-5 h-5" /> : step.icon}
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${step.completed ? "text-zinc-400 line-through" : "text-white"}`}>
                {step.title}
              </h3>
              <span className="flex items-center gap-1 text-zinc-500 text-sm">
                <Clock className="w-3 h-3" />
                {step.timeEstimate}
              </span>
            </div>
            <p className="text-zinc-400 text-sm">
              {step.description}
            </p>
          </div>

          <ArrowRight
            className={`w-5 h-5 text-zinc-400 transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-6 bg-zinc-950/50">
          {/* Expected Outcome for Starter+ */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4">
            <p className="text-emerald-300 text-sm font-medium mb-1">Why this matters:</p>
            <p className="text-zinc-300 text-sm">
              {step.priority === "critical" 
                ? `AI frequently cites ${step.title.includes("G2") ? "G2" : step.title.includes("Capterra") ? "Capterra" : "this source"} when recommending tools in your category. Completing this increases your chance of being mentioned.`
                : `Getting listed here helps AI discover your product when answering relevant queries.`}
            </p>
          </div>

          <h4 className="font-medium text-white mb-3">Steps:</h4>
          <ol className="space-y-2 mb-4">
            {step.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <span className="text-zinc-300">{s}</span>
              </li>
            ))}
          </ol>

          {step.link && (
            <a
              href={step.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              {step.linkText}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

