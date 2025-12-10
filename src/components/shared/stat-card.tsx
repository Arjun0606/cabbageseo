"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  className,
  loading = false,
}: StatCardProps) {
  const getTrendInfo = () => {
    if (trend === "up" || (change && change > 0)) {
      return {
        icon: TrendingUp,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      };
    }
    if (trend === "down" || (change && change < 0)) {
      return {
        icon: TrendingDown,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      };
    }
    return {
      icon: Minus,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    };
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  if (loading) {
    return (
      <Card className={cn("card-hover", className)}>
        <CardContent className="p-6">
          <div className="shimmer h-4 w-24 rounded bg-muted mb-3" />
          <div className="shimmer h-8 w-32 rounded bg-muted mb-2" />
          <div className="shimmer h-4 w-16 rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("card-hover", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight animate-number-tick">
            {value}
          </span>
        </div>
        {(change !== undefined || changeLabel) && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
                trendInfo.bgColor,
                trendInfo.color
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {change !== undefined && (
                <span>{change > 0 ? "+" : ""}{change}%</span>
              )}
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// MINI STAT
// ============================================

interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  change?: number;
  className?: string;
}

export function MiniStat({ label, value, trend, change, className }: MiniStatProps) {
  const trendColor =
    trend === "up" ? "text-green-500" :
    trend === "down" ? "text-red-500" :
    "text-muted-foreground";

  return (
    <div className={cn("metric-highlight pl-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{value}</span>
        {change !== undefined && (
          <span className={cn("text-xs font-medium", trendColor)}>
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// BIG STAT
// ============================================

interface BigStatProps {
  label: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function BigStat({ label, value, subtitle, className }: BigStatProps) {
  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-4xl font-bold tracking-tight gradient-text">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

