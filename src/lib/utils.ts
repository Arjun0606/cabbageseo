import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getDifficultyLabel(difficulty: number): {
  label: string;
  color: string;
} {
  if (difficulty <= 20) return { label: "Very Easy", color: "text-green-600" };
  if (difficulty <= 40) return { label: "Easy", color: "text-green-500" };
  if (difficulty <= 60) return { label: "Medium", color: "text-yellow-500" };
  if (difficulty <= 80) return { label: "Hard", color: "text-orange-500" };
  return { label: "Very Hard", color: "text-red-500" };
}

export function getIntentLabel(intent: string): {
  label: string;
  color: string;
  bgColor: string;
} {
  const intents: Record<string, { label: string; color: string; bgColor: string }> = {
    informational: {
      label: "Informational",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
    },
    commercial: {
      label: "Commercial",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
    },
    transactional: {
      label: "Transactional",
      color: "text-green-700",
      bgColor: "bg-green-100",
    },
    navigational: {
      label: "Navigational",
      color: "text-gray-700",
      bgColor: "bg-gray-100",
    },
  };
  return intents[intent] || intents.informational;
}

export function calculateSEOScore(metrics: {
  hasTitle: boolean;
  hasMetaDescription: boolean;
  hasH1: boolean;
  wordCount: number;
  hasImages: boolean;
  hasInternalLinks: boolean;
  hasExternalLinks: boolean;
  hasSchema: boolean;
}): number {
  let score = 0;
  if (metrics.hasTitle) score += 15;
  if (metrics.hasMetaDescription) score += 15;
  if (metrics.hasH1) score += 10;
  if (metrics.wordCount >= 300) score += 10;
  if (metrics.wordCount >= 1000) score += 10;
  if (metrics.wordCount >= 2000) score += 5;
  if (metrics.hasImages) score += 10;
  if (metrics.hasInternalLinks) score += 10;
  if (metrics.hasExternalLinks) score += 5;
  if (metrics.hasSchema) score += 10;
  return Math.min(score, 100);
}

