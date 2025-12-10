"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Globe,
  Settings,
  TrendingUp,
  FileText,
  Target,
  ExternalLink,
  MoreVertical,
  Trash2,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Mock data
const sites = [
  {
    id: "1",
    domain: "example.com",
    name: "Example Blog",
    traffic: 24847,
    trafficChange: 34,
    keywords: 847,
    articles: 127,
    cmsConnected: true,
    cmsType: "wordpress",
    gscConnected: true,
    autopilotEnabled: true,
  },
  {
    id: "2",
    domain: "myblog.io",
    name: "My Personal Blog",
    traffic: 8432,
    trafficChange: 12,
    keywords: 234,
    articles: 45,
    cmsConnected: true,
    cmsType: "webflow",
    gscConnected: false,
    autopilotEnabled: false,
  },
];

export default function SitesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSiteDomain, setNewSiteDomain] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteCms, setNewSiteCms] = useState("");

  const handleAddSite = () => {
    // TODO: Implement site creation
    console.log({ newSiteDomain, newSiteName, newSiteCms });
    setIsAddDialogOpen(false);
    setNewSiteDomain("");
    setNewSiteName("");
    setNewSiteCms("");
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Sites"
        description="Manage your connected websites"
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new site</DialogTitle>
                <DialogDescription>
                  Connect your website to start optimizing your SEO
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={newSiteDomain}
                    onChange={(e) => setNewSiteDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Blog"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms">CMS (optional)</Label>
                  <Select value={newSiteCms} onValueChange={setNewSiteCms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your CMS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wordpress">WordPress</SelectItem>
                      <SelectItem value="webflow">Webflow</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="custom">Custom/Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSite}>Add Site</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {sites.map((site) => (
            <Card key={site.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                    <Globe className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {site.domain}
                      </span>
                      <Link
                        href={`https://${site.domain}`}
                        target="_blank"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Zap className="mr-2 h-4 w-4" />
                      Configure Autopilot
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Site
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <TrendingUp className="h-3 w-3" />
                      Traffic
                    </div>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {site.traffic.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      +{site.trafficChange}%
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Target className="h-3 w-3" />
                      Keywords
                    </div>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {site.keywords}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <FileText className="h-3 w-3" />
                      Articles
                    </div>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {site.articles}
                    </p>
                  </div>
                </div>

                {/* Integrations */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {site.cmsConnected && (
                    <Badge variant="secondary" className="capitalize">
                      {site.cmsType} connected
                    </Badge>
                  )}
                  {site.gscConnected ? (
                    <Badge variant="success">GSC connected</Badge>
                  ) : (
                    <Badge variant="outline">GSC not connected</Badge>
                  )}
                  {site.autopilotEnabled && (
                    <Badge>
                      <Zap className="mr-1 h-3 w-3" />
                      Autopilot
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Link href={`/sites/${site.id}`} className="flex-1">
                    <Button className="w-full">View Dashboard</Button>
                  </Link>
                  <Link href={`/sites/${site.id}/settings`}>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Site Card */}
          <Card className="flex items-center justify-center border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                Add another site
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Connect more websites to your account
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Site
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

