"use client";

import { useState } from "react";
import {
  Link2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================
// TYPES
// ============================================

type IntegrationStatus = "connected" | "disconnected" | "error";
type IntegrationCategory = "cms" | "analytics" | "seo" | "ai";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync?: string;
  credentials?: Record<string, string>;
}

// ============================================
// MOCK DATA
// ============================================

const integrations: Integration[] = [
  // CMS
  {
    id: "wordpress",
    name: "WordPress",
    description: "Publish content directly to your WordPress site",
    icon: "🔵",
    category: "cms",
    status: "connected",
    lastSync: "2 hours ago",
  },
  {
    id: "webflow",
    name: "Webflow",
    description: "Publish to your Webflow CMS collections",
    icon: "🔷",
    category: "cms",
    status: "disconnected",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Manage your Shopify blog content",
    icon: "🛒",
    category: "cms",
    status: "disconnected",
  },

  // Analytics
  {
    id: "gsc",
    name: "Google Search Console",
    description: "Track rankings, clicks, and impressions",
    icon: "🔍",
    category: "analytics",
    status: "connected",
    lastSync: "1 hour ago",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    description: "Track traffic and user behavior",
    icon: "📊",
    category: "analytics",
    status: "connected",
    lastSync: "1 hour ago",
  },

  // SEO Tools
  {
    id: "ahrefs",
    name: "Ahrefs",
    description: "Access backlink data and keyword metrics",
    icon: "🔗",
    category: "seo",
    status: "disconnected",
  },
  {
    id: "semrush",
    name: "SEMrush",
    description: "Competitor analysis and keyword data",
    icon: "📈",
    category: "seo",
    status: "disconnected",
  },
  {
    id: "dataforseo",
    name: "DataForSEO",
    description: "SERP data and keyword metrics",
    icon: "📡",
    category: "seo",
    status: "connected",
    lastSync: "30 min ago",
  },

  // AI
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models for content generation",
    icon: "🤖",
    category: "ai",
    status: "connected",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude models for content generation",
    icon: "🧠",
    category: "ai",
    status: "connected",
  },
];

// ============================================
// INTEGRATION CARD
// ============================================

function IntegrationCard({ integration }: { integration: Integration }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsConnecting(false);
    setShowDialog(false);
  };

  const statusConfig = {
    connected: {
      label: "Connected",
      color: "bg-green-500/10 text-green-500",
      icon: CheckCircle2,
    },
    disconnected: {
      label: "Not Connected",
      color: "bg-gray-500/10 text-gray-500",
      icon: XCircle,
    },
    error: {
      label: "Error",
      color: "bg-red-500/10 text-red-500",
      icon: AlertCircle,
    },
  };

  const status = statusConfig[integration.status];
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{integration.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{integration.name}</h3>
              <Badge variant="secondary" className={status.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {integration.description}
            </p>
            {integration.lastSync && (
              <p className="text-xs text-muted-foreground">
                Last synced: {integration.lastSync}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {integration.status === "connected" ? (
              <>
                <Button variant="ghost" size="icon" title="Sync">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Settings">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{integration.name} Settings</DialogTitle>
                      <DialogDescription>
                        Manage your {integration.name} connection
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-green-500">Connected</p>
                          <p className="text-sm text-muted-foreground">
                            Last synced: {integration.lastSync}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Close
                      </Button>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect {integration.name}</DialogTitle>
                    <DialogDescription>
                      Enter your credentials to connect
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {integration.id === "wordpress" && (
                      <>
                        <div className="space-y-2">
                          <Label>Site URL</Label>
                          <Input placeholder="https://yourblog.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input placeholder="admin" />
                        </div>
                        <div className="space-y-2">
                          <Label>Application Password</Label>
                          <Input type="password" placeholder="xxxx xxxx xxxx" />
                        </div>
                      </>
                    )}
                    {integration.id === "webflow" && (
                      <div className="space-y-2">
                        <Label>API Token</Label>
                        <Input type="password" placeholder="Your Webflow API token" />
                      </div>
                    )}
                    {integration.id === "shopify" && (
                      <>
                        <div className="space-y-2">
                          <Label>Shop Domain</Label>
                          <Input placeholder="your-store.myshopify.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Access Token</Label>
                          <Input type="password" placeholder="shpat_xxxxx" />
                        </div>
                      </>
                    )}
                    {(integration.id === "gsc" || integration.id === "ga4") && (
                      <div className="text-center py-4">
                        <Button className="gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Sign in with Google
                        </Button>
                      </div>
                    )}
                    {(integration.id === "ahrefs" || integration.id === "semrush" || integration.id === "dataforseo") && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder="Your API key" />
                      </div>
                    )}
                    {(integration.id === "openai" || integration.id === "anthropic") && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder="sk-..." />
                        <p className="text-xs text-muted-foreground">
                          Your API key is encrypted and stored securely
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConnect} disabled={isConnecting}>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Link2 className="w-4 h-4 mr-2" />
                      )}
                      Connect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IntegrationsPage() {
  const categories = [
    { id: "all", label: "All" },
    { id: "cms", label: "CMS" },
    { id: "analytics", label: "Analytics" },
    { id: "seo", label: "SEO Tools" },
    { id: "ai", label: "AI" },
  ];

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">
            {connectedCount} of {integrations.length} integrations connected
          </p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4 mt-4">
            {integrations
              .filter((i) => cat.id === "all" || i.category === cat.id)
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
