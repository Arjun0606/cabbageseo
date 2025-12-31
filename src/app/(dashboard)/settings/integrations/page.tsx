"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
  Zap,
  ExternalLink,
  Globe,
  BarChart3,
  Info,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useSite } from "@/contexts/site-context";

// ============================================
// TYPES
// ============================================

type IntegrationStatus = "connected" | "disconnected" | "error";
type IntegrationCategory = "publish" | "analytics";

interface Integration {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: IntegrationCategory;
  status: IntegrationStatus;
  lastSync?: string;
  benefit: string;
}

interface IntegrationsData {
  integrations: Array<{
    type: string;
    status: IntegrationStatus;
    lastSync?: string;
  }>;
}

// ============================================
// INTEGRATION CONFIGURATIONS
// ============================================

const PUBLISH_INTEGRATIONS = [
  {
    id: "wordpress",
    type: "wordpress",
    name: "WordPress",
    description: "Most popular CMS for SaaS blogs",
    benefit: "1-click publish AI-generated content",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
        <span className="text-xl">🔵</span>
      </div>
    ),
    fields: [
      { key: "siteUrl", label: "Your WordPress URL", placeholder: "https://blog.yourapp.com", type: "url" },
      { key: "username", label: "Username", placeholder: "admin", type: "text" },
      { key: "applicationPassword", label: "Application Password", placeholder: "xxxx xxxx xxxx xxxx", type: "password", hint: "Generate in WordPress → Users → Application Passwords" },
    ],
  },
  {
    id: "webflow",
    type: "webflow",
    name: "Webflow",
    description: "Popular for SaaS landing pages",
    benefit: "Publish to your CMS collections",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
        <span className="text-xl">🔷</span>
      </div>
    ),
    fields: [
      { key: "accessToken", label: "API Token", placeholder: "Your Webflow API token", type: "password", hint: "Get from Webflow → Account Settings → API Access" },
      { key: "collectionId", label: "Collection ID", placeholder: "collection_xxxxx", type: "text", hint: "ID of the CMS collection to publish to" },
    ],
  },
  {
    id: "shopify",
    type: "shopify",
    name: "Shopify",
    description: "E-commerce & marketplace blogs",
    benefit: "Auto-publish product content",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
        <span className="text-xl">🛒</span>
      </div>
    ),
    fields: [
      { key: "shopDomain", label: "Shop Domain", placeholder: "your-store.myshopify.com", type: "text" },
      { key: "accessToken", label: "Admin API Token", placeholder: "shpat_xxxxx", type: "password", hint: "Create in Shopify Admin → Settings → Apps → Develop apps" },
    ],
  },
  {
    id: "ghost",
    type: "ghost",
    name: "Ghost",
    description: "Modern publishing platform",
    benefit: "Clean, fast blog publishing",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
        <span className="text-xl">👻</span>
      </div>
    ),
    fields: [
      { key: "apiUrl", label: "Ghost URL", placeholder: "https://yourblog.ghost.io", type: "url" },
      { key: "adminApiKey", label: "Admin API Key", placeholder: "xxxxx:yyyyy", type: "password", hint: "Get from Ghost Admin → Settings → Integrations → Add custom integration" },
    ],
  },
  {
    id: "notion",
    type: "notion",
    name: "Notion",
    description: "Publish to Notion databases",
    benefit: "Content in your workspace",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-neutral-500/20 flex items-center justify-center">
        <span className="text-xl">📝</span>
      </div>
    ),
    fields: [
      { key: "integrationToken", label: "Integration Token", placeholder: "secret_xxxxx", type: "password", hint: "Create at notion.so/my-integrations" },
      { key: "databaseId", label: "Database ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text", hint: "ID of the database to publish to (from URL)" },
    ],
  },
  {
    id: "hubspot",
    type: "hubspot",
    name: "HubSpot",
    description: "Marketing & CRM blog",
    benefit: "Integrated marketing content",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
        <span className="text-xl">🧡</span>
      </div>
    ),
    fields: [
      { key: "accessToken", label: "Private App Token", placeholder: "pat-xxxxx", type: "password", hint: "Create in HubSpot → Settings → Integrations → Private Apps" },
    ],
  },
  {
    id: "framer",
    type: "framer",
    name: "Framer",
    description: "Design-first websites",
    benefit: "Beautiful blog content",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
        <span className="text-xl">🎨</span>
      </div>
    ),
    fields: [
      { key: "projectId", label: "Project ID", placeholder: "Your Framer project ID", type: "text" },
      { key: "accessToken", label: "API Token", placeholder: "Your Framer API token", type: "password", hint: "Get from Framer project settings" },
    ],
  },
  {
    id: "webhook",
    type: "webhook",
    name: "Webhooks",
    description: "Custom integrations",
    benefit: "Connect to Zapier, Make, n8n",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
        <span className="text-xl">🔗</span>
      </div>
    ),
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.zapier.com/...", type: "url" },
      { key: "secretKey", label: "Secret Key (Optional)", placeholder: "For signature verification", type: "password", hint: "We'll sign payloads with HMAC-SHA256" },
    ],
  },
];

const ANALYTICS_INTEGRATIONS = [
  {
    id: "gsc",
    type: "gsc",
    name: "Google Search Console",
    description: "See exactly what keywords you rank for",
    benefit: "Real ranking data from Google",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
        <span className="text-xl">🔍</span>
      </div>
    ),
    isGoogle: true,
  },
  {
    id: "ga4",
    type: "ga4",
    name: "Google Analytics 4",
    description: "Track traffic from AI search",
    benefit: "See AI referral traffic",
    icon: (
      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
        <span className="text-xl">📊</span>
      </div>
    ),
    isGoogle: true,
  },
];

// ============================================
// INTEGRATION CARD
// ============================================

function IntegrationCard({
  integration,
  config,
  onConnect,
  isConnecting,
}: {
  integration: Integration;
  config: typeof PUBLISH_INTEGRATIONS[0] | typeof ANALYTICS_INTEGRATIONS[0];
  onConnect: (type: string, credentials: Record<string, string>) => void;
  isConnecting: boolean;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);

  const handleConnect = async () => {
    setValidating(true);
    try {
      await onConnect(integration.type, credentials);
      setShowDialog(false);
      setCredentials({});
    } finally {
      setValidating(false);
    }
  };

  const isGoogle = "isGoogle" in config && config.isGoogle;

  return (
    <Card className={`transition-all ${
      integration.status === "connected" 
        ? "bg-emerald-500/5 border-emerald-500/30" 
        : "hover:border-zinc-600"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {integration.icon}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{integration.name}</h3>
              {integration.status === "connected" ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-400">{integration.description}</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {integration.benefit}
            </p>
          </div>
          <div>
            {integration.status === "connected" ? (
              <Button variant="outline" size="sm" className="text-zinc-400 border-zinc-700">
                Manage
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setShowDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Connection Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                {integration.icon}
                Connect {integration.name}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {integration.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isGoogle ? (
                // Google OAuth flow
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-8 h-8" />
                  </div>
                  <p className="text-zinc-300 mb-4">
                    Connect with Google to access your {integration.name} data securely.
                  </p>
                  <Button 
                    onClick={() => window.location.href = "/api/auth/google?scope=gsc,ga4"}
                    className="bg-white text-zinc-900 hover:bg-zinc-100"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                    Continue with Google
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-zinc-500 mt-4">
                    We only request read-only access to your analytics data.
                  </p>
                </div>
              ) : (
                // Credential-based flow
                <>
                  {"fields" in config && config.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-zinc-300">{field.label}</Label>
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={credentials[field.key] || ""}
                        onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                      {field.hint && (
                        <p className="text-xs text-zinc-500">{field.hint}</p>
                      )}
                    </div>
                  ))}
                  
                  {/* Quick setup guide */}
                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <p className="text-sm text-zinc-400 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <a 
                        href={`https://cabbageseo.com/docs/connect-${integration.type}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline"
                      >
                        View setup guide →
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>

            {!isGoogle && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="border-zinc-700 text-zinc-300">
                  Cancel
                </Button>
                <Button 
                  onClick={handleConnect} 
                  disabled={isConnecting || validating}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  {(isConnecting || validating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect & Test
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
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
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32 bg-zinc-800" />
                <Skeleton className="h-4 w-48 bg-zinc-800" />
              </div>
              <Skeleton className="h-9 w-24 bg-zinc-800" />
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
  
  // Global site context - integrations are connected per-site for CMS publishing
  const { selectedSite } = useSite();

  // Fetch integrations (filtered by selected site)
  const { data, isLoading, error, refetch } = useQuery<IntegrationsData>({
    queryKey: ["integrations", selectedSite?.id],
    queryFn: async () => {
      const url = selectedSite?.id 
        ? `/api/integrations?siteId=${selectedSite.id}`
        : "/api/integrations";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch integrations");
      const json = await response.json();
      return json.data;
    },
  });

  // Connect mutation - links integration to selected site
  const connectMutation = useMutation({
    mutationFn: async ({ type, credentials }: { type: string; credentials: Record<string, string> }) => {
      setConnectingType(type);
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type, 
          credentials,
          siteId: selectedSite?.id, // Link to current site
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect");
      }
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

  // Merge with connected status
  const connectedMap = new Map((data?.integrations || []).map((i) => [i.type, i]));

  const publishIntegrations: Integration[] = PUBLISH_INTEGRATIONS.map((config) => {
    const connected = connectedMap.get(config.type);
    return {
      ...config,
      category: "publish" as IntegrationCategory,
      status: connected?.status || "disconnected",
      lastSync: connected?.lastSync,
    };
  });

  const analyticsIntegrations: Integration[] = ANALYTICS_INTEGRATIONS.map((config) => {
    const connected = connectedMap.get(config.type);
    return {
      ...config,
      category: "analytics" as IntegrationCategory,
      status: connected?.status || "disconnected",
      lastSync: connected?.lastSync,
    };
  });

  const connectedCount = [...publishIntegrations, ...analyticsIntegrations].filter(
    (i) => i.status === "connected"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-zinc-400">
          Connect once, publish everywhere. {connectedCount > 0 && `(${connectedCount} connected)`}
        </p>
      </div>

      {/* Site Context Notice */}
      {selectedSite && (
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-400">
                Integrations for: {selectedSite.domain}
              </p>
              <p className="text-sm text-zinc-400">
                CMS integrations are linked to your selected site. Publishing will go to this site's connected CMS.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Failed to load integrations</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto border-red-500/30 text-red-400">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && <IntegrationsLoading />}

      {!isLoading && (
        <>
          {/* Publish Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Publish Content</h2>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">CMS</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              Connect your blog or CMS to publish AI-generated content with one click.
            </p>
            <div className="grid gap-3">
              {publishIntegrations.map((integration) => {
                const config = PUBLISH_INTEGRATIONS.find((c) => c.type === integration.type)!;
                return (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    config={config}
                    onConnect={(type, creds) => connectMutation.mutate({ type, credentials: creds })}
                    isConnecting={connectingType === integration.type}
                  />
                );
              })}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Analytics</h2>
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">Google</Badge>
            </div>
            <p className="text-sm text-zinc-500">
              Connect Google to see real ranking data and track AI search traffic.
            </p>
            <div className="grid gap-3">
              {analyticsIntegrations.map((integration) => {
                const config = ANALYTICS_INTEGRATIONS.find((c) => c.type === integration.type)!;
                return (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    config={config}
                    onConnect={(type, creds) => connectMutation.mutate({ type, credentials: creds })}
                    isConnecting={connectingType === integration.type}
                  />
                );
              })}
            </div>
          </div>

          {/* CTA for not connected */}
          {connectedCount === 0 && (
            <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 border-emerald-500/20">
              <div className="text-center">
                <Zap className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Connect to unlock full power
                </h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Without integrations, you can still generate content. But connecting your blog 
                  means 1-click publishing, and connecting Google means real ranking data.
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
