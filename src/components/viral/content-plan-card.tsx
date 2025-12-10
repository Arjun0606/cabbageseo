"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  FileText,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Zap,
  Calendar,
  BarChart3,
} from "lucide-react";

interface ContentIdea {
  title: string;
  type: "pillar" | "how-to" | "listicle" | "comparison" | "guide";
  keyword: string;
  volume: number;
  difficulty: number;
  estimatedTraffic: number;
  priority: number;
}

interface ContentPlanCardProps {
  domain: string;
  isGenerating?: boolean;
  ideas?: ContentIdea[];
  onGenerate?: () => void;
}

const defaultIdeas: ContentIdea[] = [
  { title: "The Complete Guide to [Your Topic]", type: "pillar", keyword: "main keyword", volume: 5400, difficulty: 42, estimatedTraffic: 2100, priority: 1 },
  { title: "How to [Solve Problem] in 2024", type: "how-to", keyword: "how to keyword", volume: 3200, difficulty: 35, estimatedTraffic: 1400, priority: 2 },
  { title: "15 Best [Category] Tools", type: "listicle", keyword: "best tools", volume: 2800, difficulty: 48, estimatedTraffic: 980, priority: 3 },
  { title: "[Your Solution] vs [Competitor]", type: "comparison", keyword: "vs keyword", volume: 1900, difficulty: 38, estimatedTraffic: 720, priority: 4 },
  { title: "Beginner's Guide to [Topic]", type: "guide", keyword: "beginner guide", volume: 2400, difficulty: 32, estimatedTraffic: 1100, priority: 5 },
];

const typeColors: Record<string, string> = {
  pillar: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "how-to": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  listicle: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  comparison: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  guide: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
};

export function ContentPlanCard({
  domain,
  isGenerating = false,
  ideas = defaultIdeas,
  onGenerate,
}: ContentPlanCardProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(!isGenerating);

  const steps = [
    "Analyzing your niche...",
    "Finding keyword gaps...",
    "Analyzing competitors...",
    "Clustering topics...",
    "Generating content plan...",
  ];

  useEffect(() => {
    if (isGenerating) {
      setShowResults(false);
      setProgress(0);
      setCurrentStep(0);
      
      const totalTime = 10000; // 10 seconds
      const stepTime = totalTime / steps.length;
      
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        setProgress((elapsed / totalTime) * 100);
        setCurrentStep(Math.min(Math.floor(elapsed / stepTime), steps.length - 1));
        
        if (elapsed >= totalTime) {
          clearInterval(interval);
          setShowResults(true);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const totalTraffic = ideas.reduce((sum, idea) => sum + idea.estimatedTraffic, 0);

  if (isGenerating && !showResults) {
    return (
      <Card className="w-full max-w-lg overflow-hidden border-2 shadow-2xl">
        <div className="bg-gradient-to-r from-cabbage-500 to-cabbage-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <div>
              <p className="text-white font-semibold">Generating Content Plan</p>
              <p className="text-xs text-white/70">{domain}</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-slate-500">
              {Math.round(progress)}% complete
            </p>
          </div>
          
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  i < currentStep
                    ? "bg-green-50 dark:bg-green-950"
                    : i === currentStep
                    ? "bg-cabbage-50 dark:bg-cabbage-950"
                    : "bg-slate-50 dark:bg-slate-800/50"
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : i === currentStep ? (
                  <Loader2 className="h-5 w-5 text-cabbage-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
                <span className={`text-sm ${i <= currentStep ? "font-medium" : "text-slate-400"}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>AI analysis in progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg overflow-hidden border-2 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cabbage-400 to-cabbage-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">AI Content Plan</p>
              <p className="text-xs text-slate-400">{domain} • Generated in 10s</p>
            </div>
          </div>
          <Badge className="bg-green-500 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            10 sec
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Traffic Potential Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cabbage-500 to-cabbage-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Estimated Monthly Traffic</p>
              <p className="text-3xl font-bold">{totalTraffic.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-0">
                <TrendingUp className="h-3 w-3 mr-1" />
                High Potential
              </Badge>
            </div>
          </div>
        </div>

        {/* Content Ideas */}
        <div className="space-y-3">
          {ideas.map((idea, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 text-white text-sm flex items-center justify-center font-bold shrink-0">
                  {idea.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white mb-2">
                    {idea.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={typeColors[idea.type]} variant="secondary">
                      {idea.type}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {idea.keyword}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {idea.volume}/mo
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`shrink-0 ${
                  idea.difficulty < 40 ? "text-green-600 border-green-300" :
                  idea.difficulty < 60 ? "text-yellow-600 border-yellow-300" :
                  "text-red-600 border-red-300"
                }`}>
                  KD {idea.difficulty}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Button className="flex-1 gap-2">
            <Zap className="h-4 w-4" />
            Start Writing
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
        </div>

        {/* Branding */}
        <p className="text-xs text-center text-slate-400">
          Powered by CabbageSEO • Get your free content plan at cabbageseo.com
        </p>
      </CardContent>
    </Card>
  );
}

