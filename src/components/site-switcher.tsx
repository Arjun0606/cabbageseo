"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Plus, Check, ExternalLink, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const { sites, selectedSite, selectSite, isLoading, refreshSites } = useSite();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<{ id: string; domain: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sites/${siteToDelete.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete site");
      
      // Refresh the sites list
      await refreshSites();
      setDeleteDialogOpen(false);
      setSiteToDelete(null);
    } catch (error) {
      console.error("Error deleting site:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-[180px] justify-between">
        <Globe className="w-4 h-4 mr-2 text-zinc-400" />
        <span className="text-zinc-400">Loading...</span>
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
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[280px] bg-zinc-900 border-zinc-700">
        <DropdownMenuLabel className="text-xs text-zinc-400 font-normal">
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
            className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {site.id === selectedSite?.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Globe className="w-4 h-4 text-zinc-400" />
                )}
                <div>
                  <div className="font-medium">{site.domain}</div>
                  <div className="text-xs text-zinc-400">
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
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSiteToDelete({ id: site.id, domain: site.domain });
                    setDeleteDialogOpen(true);
                    setOpen(false);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-opacity p-1 -m-1"
                  title="Delete site"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
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

        <DropdownMenuSeparator className="bg-zinc-800" />
        
        <DropdownMenuItem
          onClick={() => {
            router.push("/sites");
            setOpen(false);
          }}
          className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 text-sm"
        >
          Manage All Sites
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Site
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{siteToDelete?.domain}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-400 mb-3">This will permanently remove:</p>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                All SEO audit data and issues
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                All keyword research and rankings
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                All generated content for this site
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                All GEO analysis and recommendations
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteSite}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}

