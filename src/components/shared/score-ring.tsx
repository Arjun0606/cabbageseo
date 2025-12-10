"use client";

import { cn } from "@/lib/utils";

// ============================================
// SCORE RING COMPONENT
// ============================================

interface ScoreRingProps {
  score: number;           // 0-100
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ScoreRing({
  score,
  size = "md",
  showLabel = true,
  label,
  className,
}: ScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  const sizeConfig = {
    sm: { size: 64, strokeWidth: 4, fontSize: "text-lg" },
    md: { size: 96, strokeWidth: 6, fontSize: "text-2xl" },
    lg: { size: 128, strokeWidth: 8, fontSize: "text-3xl" },
    xl: { size: 160, strokeWidth: 10, fontSize: "text-4xl" },
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getScoreColor = () => {
    if (normalizedScore >= 90) return "stroke-green-500";
    if (normalizedScore >= 70) return "stroke-primary";
    if (normalizedScore >= 50) return "stroke-yellow-500";
    if (normalizedScore >= 30) return "stroke-orange-500";
    return "stroke-red-500";
  };

  const getScoreLabel = () => {
    if (normalizedScore >= 90) return "Excellent";
    if (normalizedScore >= 70) return "Good";
    if (normalizedScore >= 50) return "Average";
    if (normalizedScore >= 30) return "Poor";
    return "Critical";
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        {/* Background ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.size}
          height={config.size}
        >
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted/20"
          />
        </svg>

        {/* Progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.size}
          height={config.size}
        >
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-1000 ease-out score-ring", getScoreColor())}
            style={{
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", config.fontSize)}>{normalizedScore}</span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">{label || getScoreLabel()}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// LINEAR SCORE BAR
// ============================================

interface ScoreBarProps {
  score: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ScoreBar({ score, label, showValue = true, className }: ScoreBarProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));

  const getScoreColor = () => {
    if (normalizedScore >= 90) return "bg-green-500";
    if (normalizedScore >= 70) return "bg-primary";
    if (normalizedScore >= 50) return "bg-yellow-500";
    if (normalizedScore >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && <span className="font-medium">{normalizedScore}/100</span>}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full progress-animated",
            getScoreColor()
          )}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// SCORE BREAKDOWN
// ============================================

interface ScoreBreakdownProps {
  items: Array<{
    label: string;
    score: number;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export function ScoreBreakdown({ items, className }: ScoreBreakdownProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-medium">{item.score}%</span>
          </div>
          <ScoreBar score={item.score} showValue={false} />
        </div>
      ))}
    </div>
  );
}

