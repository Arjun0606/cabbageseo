"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Plus, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSite } from "@/contexts/site-context";
import { cn } from "@/lib/utils";

// ============================================
// SCORE BADGE
// ============================================

function ScoreBadge({ score, size = "sm" }: { score: number | null; size?: "sm" | "md" }) {
  if (score === null) return null;
  
  const color = score >= 70 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const sizeClass = size === "sm" ? "text-xs font-medium" : "text-sm font-semibold";
  
  return (
    <span className={cn(color, sizeClass)}>{score}</span>
  );
}

// ============================================
// SITE SWITCHER
// ============================================

export function SiteSwitcher() {
  const router = useRouter();
  const { sites, selectedSite, selectSite, isLoading } = useSite();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[180px] justify-between">
        <Globe className="w-4 h-4 mr-2 text-zinc-500" />
        <span className="text-zinc-500">Loading...</span>
      </Button>
    );
  }

  if (sites.length === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => router.push("/sites/new")}
        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Site
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-[200px] justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="truncate">
              {selectedSite?.domain || "Select site"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedSite && <ScoreBadge score={selectedSite.seoScore} />}
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[280px] bg-zinc-900 border-zinc-700">
        <DropdownMenuLabel className="text-xs text-zinc-500 font-normal">
          Your Sites ({sites.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        {sites.map((site) => (
          <DropdownMenuItem
            key={site.id}
            onClick={() => {
              selectSite(site.id);
              setOpen(false);
            }}
            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {site.id === selectedSite?.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Globe className="w-4 h-4 text-zinc-500" />
                )}
                <div>
                  <div className="font-medium">{site.domain}</div>
                  <div className="text-xs text-zinc-500">
                    {site.pagesCount} pages
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScoreBadge score={site.seoScore} size="md" />
                <a 
                  href={`https://${site.domain}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        <DropdownMenuItem
          onClick={() => {
            router.push("/sites/new");
            setOpen(false);
          }}
          className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-emerald-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Site
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

