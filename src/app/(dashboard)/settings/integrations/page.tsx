"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Check,
  X,
  ExternalLink,
  Key,
  RefreshCw,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

// Integration type definitions
interface IntegrationField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
}

interface BaseIntegration {
  id: string;
  name: string;
  description: string;
  logo: string;
  docsUrl: string;
  required: boolean;
  category: string;
  adminOnly?: boolean;
}

interface FieldsIntegration extends BaseIntegration {
  fields: IntegrationField[];
  oauth?: false;
  perSite?: boolean;
}

interface OAuthIntegration extends BaseIntegration {
  oauth: true;
  oauthProvider: string;
  scopes: string[];
  fields?: never;
}

type Integration = FieldsIntegration | OAuthIntegration;

// Integration definitions
const INTEGRATIONS: {
  ai: FieldsIntegration[];
  seo: FieldsIntegration[];
  analytics: OAuthIntegration[];
  publishing: FieldsIntegration[];
  payments: FieldsIntegration[];
} = {
  ai: [
    {
      id: "anthropic",
      name: "Anthropic (Claude)",
      description: "Powers all AI content generation, clustering, and optimization",
      logo: "🤖",
      docsUrl: "https://console.anthropic.com/",
      fields: [
        { key: "ANTHROPIC_API_KEY", label: "API Key", type: "password", placeholder: "sk-ant-..." },
      ],
      required: true,
      category: "AI Provider",
    },
    {
      id: "openai",
      name: "OpenAI (Fallback)",
      description: "Fallback AI provider if Anthropic is unavailable",
      logo: "🧠",
      docsUrl: "https://platform.openai.com/api-keys",
      fields: [
        { key: "OPENAI_API_KEY", label: "API Key", type: "password", placeholder: "sk-..." },
      ],
      required: false,
      category: "AI Provider",
    },
  ],
  seo: [
    {
      id: "dataforseo",
      name: "DataForSEO",
      description: "Keyword research, search volumes, SERP data, and competitor analysis",
      logo: "📊",
      docsUrl: "https://dataforseo.com/apis",
      fields: [
        { key: "DATAFORSEO_LOGIN", label: "Login/Email", type: "text", placeholder: "your@email.com" },
        { key: "DATAFORSEO_PASSWORD", label: "Password", type: "password", placeholder: "API password" },
      ],
      required: true,
      category: "SEO Data",
    },
    {
      id: "serpapi",
      name: "SerpAPI",
      description: "Alternative SERP data provider - Google, Bing, YouTube results",
      logo: "🔍",
      docsUrl: "https://serpapi.com/dashboard",
      fields: [
        { key: "SERPAPI_KEY", label: "API Key", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "SEO Data",
    },
    {
      id: "ahrefs",
      name: "Ahrefs",
      description: "Backlink analysis, domain rating, referring domains",
      logo: "🔗",
      docsUrl: "https://ahrefs.com/api",
      fields: [
        { key: "AHREFS_API_KEY", label: "API Key", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "SEO Data",
    },
    {
      id: "surfer",
      name: "Surfer SEO",
      description: "Content optimization scoring and NLP analysis",
      logo: "🏄",
      docsUrl: "https://surferseo.com/",
      fields: [
        { key: "SURFER_API_KEY", label: "API Key", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "Content Optimization",
    },
  ],
  analytics: [
    {
      id: "gsc",
      name: "Google Search Console",
      description: "Search performance, rankings, clicks, impressions, indexing",
      logo: "📈",
      docsUrl: "https://search.google.com/search-console",
      oauth: true,
      oauthProvider: "google",
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      required: true,
      category: "Analytics",
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      description: "Website traffic, user behavior, conversions",
      logo: "📉",
      docsUrl: "https://analytics.google.com/",
      oauth: true,
      oauthProvider: "google",
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      required: false,
      category: "Analytics",
    },
  ],
  publishing: [
    {
      id: "wordpress",
      name: "WordPress",
      description: "Publish content directly to WordPress sites via REST API",
      logo: "📝",
      docsUrl: "https://developer.wordpress.org/rest-api/",
      perSite: true,
      fields: [
        { key: "site_url", label: "Site URL", type: "url", placeholder: "https://yoursite.com" },
        { key: "username", label: "Username", type: "text", placeholder: "admin" },
        { key: "app_password", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
      ],
      required: false,
      category: "CMS",
    },
    {
      id: "webflow",
      name: "Webflow",
      description: "Publish to Webflow CMS collections",
      logo: "🎨",
      docsUrl: "https://developers.webflow.com/",
      fields: [
        { key: "WEBFLOW_API_KEY", label: "API Key", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "CMS",
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "Publish blog posts and product descriptions to Shopify",
      logo: "🛒",
      docsUrl: "https://shopify.dev/docs/api",
      fields: [
        { key: "SHOPIFY_STORE_URL", label: "Store URL", type: "url", placeholder: "your-store.myshopify.com" },
        { key: "SHOPIFY_ACCESS_TOKEN", label: "Access Token", type: "password", placeholder: "shpat_..." },
      ],
      required: false,
      category: "CMS",
    },
  ],
  payments: [
    {
      id: "dodo",
      name: "Dodo Payments",
      description: "Subscription billing and usage-based charges",
      logo: "💳",
      docsUrl: "https://docs.dodopayments.com/",
      fields: [
        { key: "DODO_API_KEY", label: "API Key", type: "password", placeholder: "..." },
        { key: "DODO_WEBHOOK_SECRET", label: "Webhook Secret", type: "password", placeholder: "..." },
      ],
      required: true,
      category: "Billing",
      adminOnly: true,
    },
  ],
};

// Mock connected status - in production this comes from DB
const mockConnectedStatus: Record<string, { connected: boolean; lastChecked?: string; error?: string }> = {
  anthropic: { connected: true, lastChecked: "2024-12-09T10:30:00Z" },
  dataforseo: { connected: true, lastChecked: "2024-12-09T10:30:00Z" },
  gsc: { connected: false },
  ga4: { connected: false },
  wordpress: { connected: false },
};

interface IntegrationCardProps {
  integration: Integration;
  status: { connected: boolean; lastChecked?: string; error?: string };
  onConnect: () => void;
  onDisconnect: () => void;
  onTest: () => void;
}

function IntegrationCard({ integration, status, onConnect, onDisconnect, onTest }: IntegrationCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const handleTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate test
    setTesting(false);
    onTest();
  };

  return (
    <Card className={status.connected ? "border-green-200 dark:border-green-900" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl dark:bg-slate-800">
              {integration.logo}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {integration.name}
                {integration.required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {integration.category}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.connected ? (
              <Badge variant="success" className="gap-1">
                <Check className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <X className="h-3 w-3" />
                Not connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {integration.description}
        </p>
        
        {status.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
            {status.error}
          </div>
        )}
        
        {status.lastChecked && (
          <p className="text-xs text-slate-500">
            Last verified: {new Date(status.lastChecked).toLocaleString()}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          {status.connected ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCredentials(!showCredentials)}
              >
                {showCredentials ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {showCredentials ? "Hide" : "Show"} Credentials
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={onDisconnect}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-2xl">{integration.logo}</span>
                    Connect {integration.name}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your API credentials to connect {integration.name}.
                  </DialogDescription>
                </DialogHeader>
                <ConnectForm integration={integration} onConnect={onConnect} />
              </DialogContent>
            </Dialog>
          )}
          
          <Button variant="ghost" size="sm" asChild>
            <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Docs
            </a>
          </Button>
        </div>
        
        {showCredentials && status.connected && !integration.oauth && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
            <p className="mb-2 text-xs font-medium text-slate-500">Stored Credentials</p>
            {(integration as FieldsIntegration).fields?.map((field) => (
              <div key={field.key} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{field.label}</span>
                <code className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-800">
                  ••••••••••••
                </code>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConnectFormProps {
  integration: Integration;
  onConnect: () => void;
}

function ConnectForm({ integration, onConnect }: ConnectFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would call an API to save and test the credentials
      await new Promise(r => setTimeout(r, 1500));
      
      // Simulate validation for field-based integrations
      if (!integration.oauth) {
        const fields = (integration as FieldsIntegration).fields || [];
        const missingFields = fields.filter(f => !values[f.key]);
        if (missingFields.length > 0) {
          throw new Error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(", ")}`);
        }
      }
      
      onConnect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth integrations
  if (integration.oauth) {
    const oauthIntegration = integration as OAuthIntegration;
    return (
      <div className="space-y-4 py-4">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">OAuth Authentication Required</p>
              <p className="mt-1">
                You'll be redirected to Google to authorize access to your{" "}
                {integration.name} data. We only request read-only access.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => {
            // In production, this initiates OAuth flow
            window.location.href = `/api/auth/google?scope=${oauthIntegration.scopes?.join(",")}&integration=${integration.id}`;
          }}>
            Continue with Google
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const fieldsIntegration = integration as FieldsIntegration;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {fieldsIntegration.fields?.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <div className="relative">
            <Input
              id={field.key}
              type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
              placeholder={field.placeholder}
              value={values[field.key] || ""}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
            />
            {field.type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
                onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key] })}
              >
                {showPasswords[field.key] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
      
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
        <p className="text-xs text-slate-500">
          <Info className="mr-1 inline h-3 w-3" />
          Your credentials are encrypted and stored securely. They are only used to connect to {integration.name} on your behalf.
        </p>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test & Save Connection
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState(mockConnectedStatus);

  const handleConnect = (id: string) => {
    setStatuses({
      ...statuses,
      [id]: { connected: true, lastChecked: new Date().toISOString() },
    });
  };

  const handleDisconnect = (id: string) => {
    setStatuses({
      ...statuses,
      [id]: { connected: false },
    });
  };

  const allIntegrations = [
    ...INTEGRATIONS.ai,
    ...INTEGRATIONS.seo,
    ...INTEGRATIONS.analytics,
    ...INTEGRATIONS.publishing,
  ];
  
  const connectedCount = Object.values(statuses).filter(s => s.connected).length;
  const requiredIntegrations = allIntegrations.filter(i => i.required);
  const requiredConnected = requiredIntegrations.filter(i => statuses[i.id]?.connected).length;

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Integrations"
        description="Connect your SEO tools, analytics, and publishing platforms"
      />

      <div className="p-6">
        {/* Status Overview */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold">{connectedCount}/{allIntegrations.length}</p>
                <p className="text-sm text-slate-500">Integrations connected</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-2xl font-bold">{requiredConnected}/{requiredIntegrations.length}</p>
                <p className="text-sm text-slate-500">Required integrations</p>
              </div>
            </div>
            {requiredConnected < requiredIntegrations.length && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {requiredIntegrations.length - requiredConnected} required integration(s) not connected
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ai">AI Providers</TabsTrigger>
            <TabsTrigger value="seo">SEO Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="publishing">Publishing</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">AI Providers</h3>
              <p className="text-sm text-slate-500">
                AI models power content generation, keyword clustering, and optimization suggestions.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATIONS.ai.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={statuses[integration.id] || { connected: false }}
                  onConnect={() => handleConnect(integration.id)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                  onTest={() => {}}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">SEO Data Providers</h3>
              <p className="text-sm text-slate-500">
                These services provide keyword data, search volumes, backlinks, and SERP analysis.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATIONS.seo.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={statuses[integration.id] || { connected: false }}
                  onConnect={() => handleConnect(integration.id)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                  onTest={() => {}}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Analytics & Search Console</h3>
              <p className="text-sm text-slate-500">
                Connect your analytics to track performance and get AI-powered insights.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATIONS.analytics.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={statuses[integration.id] || { connected: false }}
                  onConnect={() => handleConnect(integration.id)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                  onTest={() => {}}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="publishing" className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Publishing Platforms</h3>
              <p className="text-sm text-slate-500">
                Connect your CMS to publish content directly from CabbageSEO.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {INTEGRATIONS.publishing.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  status={statuses[integration.id] || { connected: false }}
                  onConnect={() => handleConnect(integration.id)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                  onTest={() => {}}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

