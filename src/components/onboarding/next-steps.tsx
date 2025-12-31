"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  FileText, 
  Target, 
  Brain,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSite } from "@/contexts/site-context";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  priority: "high" | "medium" | "low";
  completed: boolean;
  ctaText: string;
}

// ============================================
// STEP CARD
// ============================================

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  const priorityColors = {
    high: "border-red-500/30 bg-red-500/5",
    medium: "border-yellow-500/30 bg-yellow-500/5",
    low: "border-emerald-500/30 bg-emerald-500/5",
  };
  
  const priorityBadge = {
    high: "bg-red-500/10 text-red-400",
    medium: "bg-yellow-500/10 text-yellow-400", 
    low: "bg-emerald-500/10 text-emerald-400",
  };

  if (step.completed) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-emerald-400 line-through opacity-70">{step.title}</p>
          <p className="text-sm text-zinc-400">{step.description}</p>
        </div>
      </div>
    );
  }

  return (
    <Link href={step.href}>
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer group",
        priorityColors[step.priority]
      )}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-300">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 text-zinc-400" />
            <p className="font-medium">{step.title}</p>
            <span className={cn("px-2 py-0.5 text-[10px] font-medium uppercase rounded", priorityBadge[step.priority])}>
              {step.priority}
            </span>
          </div>
          <p className="text-sm text-zinc-400">{step.description}</p>
        </div>
        <Button size="sm" variant="ghost" className="group-hover:bg-emerald-600 group-hover:text-white transition-all">
          {step.ctaText}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Link>
  );
}

// ============================================
// NEXT STEPS COMPONENT
// ============================================

export function NextSteps() {
  const { selectedSite } = useSite();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSite) {
      setSteps([]);
      setLoading(false);
      return;
    }

    // Determine steps based on site state
    const siteSteps: Step[] = [];
    
    // Check if site has issues (low SEO score)
    if (selectedSite.seoScore !== null && selectedSite.seoScore < 70) {
      siteSteps.push({
        id: "fix-issues",
        title: "Fix SEO Issues",
        description: `Your site scored ${selectedSite.seoScore}/100. Address critical issues to improve rankings.`,
        href: "/audit",
        icon: AlertTriangle,
        priority: "high",
        completed: false,
        ctaText: "View Issues",
      });
    }

    // Check if site has poor AIO score
    if (selectedSite.aioScore !== null && selectedSite.aioScore < 50) {
      siteSteps.push({
        id: "improve-aio",
        title: "Improve GEO Score",
        description: `AI platforms aren't citing you (${selectedSite.aioScore}/100). Add structured data & FAQs.`,
        href: "/geo",
        icon: Brain,
        priority: "high",
        completed: false,
        ctaText: "See Recommendations",
      });
    }

    // Always suggest keyword research
    siteSteps.push({
      id: "research-keywords",
      title: "Research Keywords",
      description: "Find low-competition keywords your competitors are missing.",
      href: "/keywords",
      icon: Target,
      priority: "medium",
      completed: false,
      ctaText: "Research",
    });

    // Always suggest content generation
    siteSteps.push({
      id: "generate-content",
      title: "Generate SEO Content",
      description: "Create AI-optimized articles that rank in Google and get cited by ChatGPT.",
      href: "/content/new",
      icon: FileText,
      priority: "medium",
      completed: false,
      ctaText: "Generate",
    });

    setSteps(siteSteps);
    setLoading(false);
  }, [selectedSite]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-1/3"></div>
            <div className="h-20 bg-zinc-800 rounded"></div>
            <div className="h-20 bg-zinc-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedSite || steps.length === 0) {
    return null;
  }

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-zinc-900 to-zinc-900/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Next Steps</CardTitle>
              <p className="text-sm text-zinc-400">
                {completedCount === steps.length 
                  ? "All done! 🎉" 
                  : `${steps.length - completedCount} actions to boost your visibility`
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-400">{completedCount}/{steps.length}</p>
            <Progress value={progress} className="w-24 h-2 [&>div]:bg-emerald-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </CardContent>
    </Card>
  );
}

