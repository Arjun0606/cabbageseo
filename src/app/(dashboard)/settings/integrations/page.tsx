"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  CheckCircle2,
  XCircle,
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
import { Skeleton } from "@/components/ui/skeleton";
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
  type: string;
  name: string;
  description: string;
  icon: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync?: string;
}

interface IntegrationsData {
  integrations: Integration[];
}

// ============================================
// AVAILABLE INTEGRATIONS
// Only user-specific integrations that require their credentials
// Platform-level APIs (DataForSEO, OpenAI, etc.) are handled by us - no user setup needed
// ============================================

const availableIntegrations: Omit<Integration, "status" | "lastSync">[] = [
  // CMS - User needs to connect their own sites
  { id: "wordpress", type: "wordpress", name: "WordPress", description: "Publish content directly to your WordPress site", icon: "🔵", category: "cms" },
  { id: "webflow", type: "webflow", name: "Webflow", description: "Publish to your Webflow CMS collections", icon: "🔷", category: "cms" },
  { id: "shopify", type: "shopify", name: "Shopify", description: "Manage your Shopify blog content", icon: "🛒", category: "cms" },
  // Analytics - User needs to connect their Google account
  { id: "gsc", type: "gsc", name: "Google Search Console", description: "Track your rankings, clicks, and impressions", icon: "🔍", category: "analytics" },
  { id: "ga4", type: "ga4", name: "Google Analytics 4", description: "Track your traffic and user behavior", icon: "📊", category: "analytics" },
];

// ============================================
// INTEGRATION CARD
// ============================================

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  isConnecting,
}: {
  integration: Integration;
  onConnect: (type: string, credentials: Record<string, string>) => void;
  onDisconnect: (id: string) => void;
  isConnecting: boolean;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const statusConfig = {
    connected: { label: "Connected", color: "bg-green-500/10 text-green-500", icon: CheckCircle2 },
    disconnected: { label: "Not Connected", color: "bg-gray-500/10 text-gray-500", icon: XCircle },
    error: { label: "Error", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
  };

  const status = statusConfig[integration.status];
  const StatusIcon = status.icon;

  const handleConnect = () => {
    onConnect(integration.type, credentials);
    setShowDialog(false);
    setCredentials({});
  };

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
                          {integration.lastSync && (
                            <p className="text-sm text-muted-foreground">
                              Last synced: {integration.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDialog(false)}>
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          onDisconnect(integration.id);
                          setShowDialog(false);
                        }}
                      >
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
                    {integration.type === "wordpress" && (
                      <>
                        <div className="space-y-2">
                          <Label>Site URL</Label>
                          <Input
                            placeholder="https://yourblog.com"
                            value={credentials.siteUrl || ""}
                            onChange={(e) => setCredentials({ ...credentials, siteUrl: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input
                            placeholder="admin"
                            value={credentials.username || ""}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Application Password</Label>
                          <Input
                            type="password"
                            placeholder="xxxx xxxx xxxx"
                            value={credentials.password || ""}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {integration.type === "webflow" && (
                      <div className="space-y-2">
                        <Label>API Token</Label>
                        <Input
                          type="password"
                          placeholder="Your Webflow API token"
                          value={credentials.apiToken || ""}
                          onChange={(e) => setCredentials({ ...credentials, apiToken: e.target.value })}
                        />
                      </div>
                    )}
                    {integration.type === "shopify" && (
                      <>
                        <div className="space-y-2">
                          <Label>Shop Domain</Label>
                          <Input
                            placeholder="your-store.myshopify.com"
                            value={credentials.shopDomain || ""}
                            onChange={(e) => setCredentials({ ...credentials, shopDomain: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Access Token</Label>
                          <Input
                            type="password"
                            placeholder="shpat_xxxxx"
                            value={credentials.accessToken || ""}
                            onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                    {(integration.type === "gsc" || integration.type === "ga4") && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Connect with your Google account to access {integration.name}
                        </p>
                        <Button onClick={handleConnect} disabled={isConnecting}>
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                          )}
                          Sign in with Google
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDialog(false)}>
                      Cancel
                    </Button>
                    {!["gsc", "ga4"].includes(integration.type) && (
                      <Button onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Connect
                      </Button>
                    )}
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
// LOADING SKELETON
// ============================================

function IntegrationsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Fetch integrations
  const { data, isLoading, error, refetch } = useQuery<IntegrationsData>({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await fetch("/api/integrations");
      if (!response.ok) throw new Error("Failed to fetch integrations");
      const json = await response.json();
      return json.data;
    },
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: Record<string, string> }) => {
      setConnectingType(type);
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, credentials }),
      });
      if (!response.ok) throw new Error("Failed to connect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setConnectingType(null);
    },
    onError: () => {
      setConnectingType(null);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/integrations?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  // Merge available integrations with connected ones
  const connectedMap = new Map((data?.integrations || []).map((i) => [i.type, i]));
  const allIntegrations: Integration[] = availableIntegrations.map((avail) => {
    const connected = connectedMap.get(avail.type);
    return {
      ...avail,
      status: connected?.status || ("disconnected" as IntegrationStatus),
      lastSync: connected?.lastSync,
    };
  });

  const getByCategory = (category: IntegrationCategory) =>
    allIntegrations.filter((i) => i.category === category);

  const connectedCount = allIntegrations.filter((i) => i.status === "connected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools and services ({connectedCount} connected)
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Failed to load integrations</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && <IntegrationsLoading />}

      {/* Integrations Tabs */}
      {!isLoading && (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({allIntegrations.length})</TabsTrigger>
            <TabsTrigger value="cms">CMS ({getByCategory("cms").length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics ({getByCategory("analytics").length})</TabsTrigger>
          </TabsList>

          {["all", "cms", "analytics"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {(tab === "all" ? allIntegrations : getByCategory(tab as IntegrationCategory)).map(
                (integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConnect={(type, creds) => connectMutation.mutate({ type, credentials: creds })}
                    onDisconnect={(id) => disconnectMutation.mutate(id)}
                    isConnecting={connectingType === integration.type}
                  />
                )
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}