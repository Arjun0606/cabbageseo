"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface SEOScoreCardProps {
  score: number;
  domain: string;
  metrics?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  issues?: {
    critical: number;
    warnings: number;
    passed: number;
  };
  trend?: "up" | "down" | "stable";
  previousScore?: number;
  onShare?: () => void;
  onExport?: () => void;
}

export function SEOScoreCard({
  score,
  domain,
  metrics = { performance: 85, accessibility: 92, bestPractices: 78, seo: score },
  issues = { critical: 3, warnings: 8, passed: 45 },
  trend = "up",
  previousScore = score - 12,
  onShare,
  onExport,
}: SEOScoreCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { main: "#22c55e", light: "rgba(34, 197, 94, 0.1)", text: "Excellent" };
    if (s >= 60) return { main: "#eab308", light: "rgba(234, 179, 8, 0.1)", text: "Good" };
    if (s >= 40) return { main: "#f97316", light: "rgba(249, 115, 22, 0.1)", text: "Needs Work" };
    return { main: "#ef4444", light: "rgba(239, 68, 68, 0.1)", text: "Critical" };
  };

  const colors = getScoreColor(score);
  const strokeWidth = 8;
  const size = 180;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8 w-auto" />
          <div>
            <p className="text-white font-semibold">CabbageSEO Score</p>
            <p className="text-xs text-slate-400">{domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-8 w-8 p-0" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Main Score Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
              <circle
                className="text-slate-100 dark:text-slate-800"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
              />
              <circle
                className="transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                stroke={colors.main}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold" style={{ color: colors.main }}>
                {animatedScore}
              </span>
              <span className="text-sm text-slate-500">{colors.text}</span>
              {trend !== "stable" && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}>
                  {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{trend === "up" ? "+" : ""}{score - previousScore} from last scan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric Bars */}
        <div className="space-y-3 mb-6">
          {[
            { label: "Performance", value: metrics.performance },
            { label: "Accessibility", value: metrics.accessibility },
            { label: "Best Practices", value: metrics.bestPractices },
            { label: "SEO", value: metrics.seo },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">{metric.label}</span>
                <span className="font-semibold">{metric.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${metric.value}%`,
                    backgroundColor: getScoreColor(metric.value).main,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Issues Summary */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xl font-bold">{issues.critical}</span>
            </div>
            <p className="text-xs text-slate-500">Critical</p>
          </div>
          <div className="text-center border-x border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xl font-bold">{issues.warnings}</span>
            </div>
            <p className="text-xs text-slate-500">Warnings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xl font-bold">{issues.passed}</span>
            </div>
            <p className="text-xs text-slate-500">Passed</p>
          </div>
        </div>

        {/* CTA */}
        <Button className="w-full mt-4 gap-2" asChild>
          <a href="https://cabbageseo.com" target="_blank" rel="noopener noreferrer">
            Get Your Free Score
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

