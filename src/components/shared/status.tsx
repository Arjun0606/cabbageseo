"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  Circle,
} from "lucide-react";

// ============================================
// STATUS TYPES
// ============================================

type StatusType = 
  | "success" 
  | "error" 
  | "warning" 
  | "info" 
  | "pending" 
  | "processing" 
  | "draft" 
  | "published"
  | "active"
  | "inactive";

// ============================================
// STATUS BADGE
// ============================================

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, {
  label: string;
  icon: typeof CheckCircle2;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    variant: "default",
    className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
  },
  error: {
    label: "Error",
    icon: XCircle,
    variant: "destructive",
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
  },
  warning: {
    label: "Warning",
    icon: AlertCircle,
    variant: "secondary",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  info: {
    label: "Info",
    icon: Circle,
    variant: "secondary",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "outline",
    className: "bg-muted text-muted-foreground",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    variant: "secondary",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  draft: {
    label: "Draft",
    icon: Circle,
    variant: "outline",
    className: "bg-muted text-muted-foreground",
  },
  published: {
    label: "Published",
    icon: CheckCircle2,
    variant: "default",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  active: {
    label: "Active",
    icon: Circle,
    variant: "default",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    icon: Circle,
    variant: "outline",
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isProcessing = status === "processing";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium border",
        config.className,
        className
      )}
    >
      <Icon className={cn("h-3 w-3", isProcessing && "animate-spin")} />
      {label || config.label}
    </Badge>
  );
}

// ============================================
// STATUS DOT
// ============================================

interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const dotConfig: Record<StatusDotProps["status"], string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
  away: "bg-yellow-500",
};

const dotSizes: Record<NonNullable<StatusDotProps["size"]>, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

export function StatusDot({ 
  status, 
  size = "md", 
  pulse = false,
  className 
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full",
        dotConfig[status],
        dotSizes[size],
        pulse && status === "online" && "status-dot-active",
        className
      )}
    />
  );
}

// ============================================
// SEVERITY INDICATOR
// ============================================

interface SeverityIndicatorProps {
  severity: "critical" | "high" | "medium" | "low" | "info";
  label?: string;
  className?: string;
}

const severityConfig: Record<SeverityIndicatorProps["severity"], {
  label: string;
  color: string;
  bgColor: string;
}> = {
  critical: {
    label: "Critical",
    color: "text-red-600",
    bgColor: "bg-red-500",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    color: "text-yellow-600",
    bgColor: "bg-yellow-500",
  },
  low: {
    label: "Low",
    color: "text-blue-600",
    bgColor: "bg-blue-500",
  },
  info: {
    label: "Info",
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
  },
};

export function SeverityIndicator({ 
  severity, 
  label, 
  className 
}: SeverityIndicatorProps) {
  const config = severityConfig[severity];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", config.bgColor)} />
      <span className={cn("text-sm font-medium", config.color)}>
        {label || config.label}
      </span>
    </div>
  );
}

