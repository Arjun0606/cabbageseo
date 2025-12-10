"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon, Sparkles, FolderOpen, Search, FileText } from "lucide-react";

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-3 w-3" />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// PRESET EMPTY STATES
// ============================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
}

export function NoSitesEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title="No sites connected"
      description="Add your first website to start analyzing and optimizing your SEO performance with AI-powered insights."
      action={
        onAction
          ? {
              label: "Add your first site",
              onClick: onAction,
              icon: Sparkles,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function NoContentEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="No content yet"
      description="Generate your first AI-powered article or import existing content to get started."
      action={
        onAction
          ? {
              label: "Generate content",
              onClick: onAction,
              icon: Sparkles,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function NoKeywordsEmpty({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title="No keywords tracked"
      description="Start researching keywords to discover ranking opportunities and track your positions."
      action={
        onAction
          ? {
              label: "Research keywords",
              onClick: onAction,
              icon: Search,
            }
          : undefined
      }
      className={className}
    />
  );
}

export function NoResultsEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
      className={className}
    />
  );
}

