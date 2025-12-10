"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Link2,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Zap,
  FileText,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface InternalLink {
  id: string;
  fromPage: string;
  fromTitle: string;
  toPage: string;
  toTitle: string;
  anchorText: string;
  context: string;
  impact: "high" | "medium" | "low";
  selected?: boolean;
}

interface InternalLinksCardProps {
  domain: string;
  links?: InternalLink[];
  onApply?: (selectedIds: string[]) => void;
}

const defaultLinks: InternalLink[] = [
  {
    id: "1",
    fromPage: "/blog/seo-guide",
    fromTitle: "The Complete SEO Guide",
    toPage: "/services/seo-audit",
    toTitle: "SEO Audit Service",
    anchorText: "professional SEO audit",
    context: "...consider getting a [professional SEO audit] to identify issues...",
    impact: "high",
  },
  {
    id: "2",
    fromPage: "/blog/content-marketing",
    fromTitle: "Content Marketing 101",
    toPage: "/blog/keyword-research",
    toTitle: "Keyword Research Guide",
    anchorText: "keyword research",
    context: "...always start with thorough [keyword research] before writing...",
    impact: "high",
  },
  {
    id: "3",
    fromPage: "/about",
    fromTitle: "About Us",
    toPage: "/case-studies",
    toTitle: "Case Studies",
    anchorText: "our case studies",
    context: "...see the results we've achieved in [our case studies]...",
    impact: "medium",
  },
  {
    id: "4",
    fromPage: "/services",
    fromTitle: "Our Services",
    toPage: "/blog/seo-tips",
    toTitle: "10 SEO Tips",
    anchorText: "SEO tips",
    context: "...check out these proven [SEO tips] from our experts...",
    impact: "medium",
  },
  {
    id: "5",
    fromPage: "/pricing",
    fromTitle: "Pricing",
    toPage: "/contact",
    toTitle: "Contact Us",
    anchorText: "get in touch",
    context: "...have questions? [get in touch] with our team...",
    impact: "low",
  },
];

const impactColors = {
  high: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function InternalLinksCard({
  domain,
  links = defaultLinks,
  onApply,
}: InternalLinksCardProps) {
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(
    new Set(links.map(l => l.id))
  );
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const toggleLink = (id: string) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLinks(newSelected);
  };

  const selectAll = () => {
    setSelectedLinks(new Set(links.map(l => l.id)));
  };

  const handleApply = async () => {
    setIsApplying(true);
    // Simulate applying links
    await new Promise(r => setTimeout(r, 2000));
    setIsApplying(false);
    setApplied(true);
    onApply?.(Array.from(selectedLinks));
  };

  const selectedCount = selectedLinks.size;
  const highImpactCount = links.filter(l => selectedLinks.has(l.id) && l.impact === "high").length;

  if (applied) {
    return (
      <Card className="w-full max-w-lg overflow-hidden border-2 border-green-200 shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Links Applied!</h3>
          <p className="text-slate-500 mb-6">
            {selectedCount} internal links have been added to your site
          </p>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950 text-left">
            <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
              <TrendingUp className="h-5 w-5" />
              <div>
                <p className="font-semibold">Expected Impact</p>
                <p className="text-sm">+15-25% improvement in page authority distribution</p>
              </div>
            </div>
          </div>
          <Button className="mt-6 gap-2" onClick={() => setApplied(false)}>
            <Sparkles className="h-4 w-4" />
            Find More Links
          </Button>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Internal Link Opportunities</p>
              <p className="text-xs text-slate-400">{domain} • {links.length} opportunities found</p>
            </div>
          </div>
          <Badge className="bg-cabbage-500 text-white border-0">
            One-Click Fix
          </Badge>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Selection Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-sm">
              Select All
            </Button>
            <span className="text-sm text-slate-500">
              {selectedCount} selected • {highImpactCount} high impact
            </span>
          </div>
        </div>

        {/* Links List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {links.map((link) => (
            <div
              key={link.id}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                selectedLinks.has(link.id) ? "bg-cabbage-50/50 dark:bg-cabbage-950/30" : ""
              }`}
              onClick={() => toggleLink(link.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedLinks.has(link.id)}
                  onCheckedChange={() => toggleLink(link.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  {/* From -> To */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <FileText className="h-3 w-3" />
                    <span className="truncate">{link.fromPage}</span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">{link.toPage}</span>
                  </div>
                  
                  {/* Context Preview */}
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    {link.context.split('[')[0]}
                    <span className="text-cabbage-600 font-medium underline">
                      {link.anchorText}
                    </span>
                    {link.context.split(']')[1]}
                  </p>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <Badge className={impactColors[link.impact]} variant="secondary">
                      {link.impact} impact
                    </Badge>
                    <span className="text-xs text-slate-400">→ {link.toTitle}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Apply CTA */}
        <div className="p-4 border-t bg-white dark:bg-slate-900">
          <Button 
            className="w-full gap-2" 
            onClick={handleApply}
            disabled={selectedCount === 0 || isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying Links...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Apply {selectedCount} Links Now
              </>
            )}
          </Button>
          <p className="text-xs text-center text-slate-400 mt-2">
            Links will be automatically added to your CMS
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

