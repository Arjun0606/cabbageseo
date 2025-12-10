"use client";

import { useState, useEffect, useCallback } from "react";
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

// ============================================
// TYPES
// ============================================

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
  testEndpoint?: string;
}

interface OAuthIntegration extends BaseIntegration {
  oauth: true;
  oauthProvider: string;
  scopes: string[];
  fields?: never;
}

type Integration = FieldsIntegration | OAuthIntegration;

interface IntegrationStatus {
  connected: boolean;
  lastChecked?: string;
  error?: string;
}

// ============================================
// INTEGRATION DEFINITIONS
// ============================================

const INTEGRATIONS: {
  ai: FieldsIntegration[];
  seo: FieldsIntegration[];
  analytics: OAuthIntegration[];
  publishing: FieldsIntegration[];
} = {
  ai: [
    {
      id: "anthropic",
      name: "Anthropic (Claude)",
      description: "Powers all AI content generation, clustering, and optimization",
      logo: "🤖",
      docsUrl: "https://console.anthropic.com/",
      fields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-ant-..." },
      ],
      required: true,
      category: "AI Provider",
      testEndpoint: "/api/integrations/test",
    },
    {
      id: "openai",
      name: "OpenAI (Fallback)",
      description: "Fallback AI provider if Anthropic is unavailable",
      logo: "🧠",
      docsUrl: "https://platform.openai.com/api-keys",
      fields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-..." },
      ],
      required: false,
      category: "AI Provider",
      testEndpoint: "/api/integrations/test",
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
        { key: "login", label: "Login/Email", type: "text", placeholder: "your@email.com" },
        { key: "password", label: "Password", type: "password", placeholder: "API password" },
      ],
      required: true,
      category: "SEO Data",
      testEndpoint: "/api/integrations/test",
    },
    {
      id: "serpapi",
      name: "SerpAPI",
      description: "Alternative SERP data provider - Google, Bing, YouTube results",
      logo: "🔍",
      docsUrl: "https://serpapi.com/dashboard",
      fields: [
        { key: "apiKey", label: "API Key", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "SEO Data",
      testEndpoint: "/api/integrations/test",
    },
  ],
  analytics: [
    {
      id: "google",
      name: "Google (GSC + GA4)",
      description: "Search Console rankings, clicks, impressions + Analytics traffic data",
      logo: "📈",
      docsUrl: "https://search.google.com/search-console",
      oauth: true,
      oauthProvider: "google",
      scopes: [
        "https://www.googleapis.com/auth/webmasters.readonly",
        "https://www.googleapis.com/auth/analytics.readonly",
      ],
      required: true,
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
        { key: "siteUrl", label: "Site URL", type: "url", placeholder: "https://yoursite.com" },
        { key: "username", label: "Username", type: "text", placeholder: "admin" },
        { key: "appPassword", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
      ],
      required: false,
      category: "CMS",
      testEndpoint: "/api/cms/test",
    },
    {
      id: "webflow",
      name: "Webflow",
      description: "Publish to Webflow CMS collections",
      logo: "🎨",
      docsUrl: "https://developers.webflow.com/",
      fields: [
        { key: "accessToken", label: "API Access Token", type: "password", placeholder: "..." },
      ],
      required: false,
      category: "CMS",
      testEndpoint: "/api/cms/test",
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "Publish blog posts and product descriptions to Shopify",
      logo: "🛒",
      docsUrl: "https://shopify.dev/docs/api",
      fields: [
        { key: "shopDomain", label: "Store Domain", type: "text", placeholder: "your-store.myshopify.com" },
        { key: "accessToken", label: "Access Token", type: "password", placeholder: "shpat_..." },
      ],
      required: false,
      category: "CMS",
      testEndpoint: "/api/cms/test",
    },
  ],
};

// ============================================
// INTEGRATION CARD COMPONENT
// ============================================

interface IntegrationCardProps {
  integration: Integration;
  status: IntegrationStatus;
  onStatusChange: () => void;
}

function IntegrationCard({ integration, status, onStatusChange }: IntegrationCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTest = async () => {
    if (integration.oauth) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: integration.id }),
      });
      
      const data = await response.json();
      setTestResult({ success: data.success, message: data.message || data.error });
    } catch (error) {
      setTestResult({ success: false, message: "Connection test failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    
    try {
      await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: integration.id }),
      });
      
      onStatusChange();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card className={status.connected ? "border-green-200 dark:border-green-900" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
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
              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
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
        <p className="text-sm text-muted-foreground">
          {integration.description}
        </p>
        
        {status.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {status.error}
          </div>
        )}

        {testResult && (
          <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            testResult.success 
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}>
            {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {testResult.message || (testResult.success ? "Connection successful!" : "Connection failed")}
          </div>
        )}
        
        {status.lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last verified: {new Date(status.lastChecked).toLocaleString()}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          {status.connected ? (
            <>
              {!integration.oauth && (
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
              )}
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect
              </Button>
            </>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                <ConnectForm 
                  integration={integration} 
                  onConnect={() => {
                    setDialogOpen(false);
                    onStatusChange();
                  }} 
                />
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
      </CardContent>
    </Card>
  );
}

// ============================================
// CONNECT FORM COMPONENT
// ============================================

interface ConnectFormProps {
  integration: Integration;
  onConnect: () => void;
}

function ConnectForm({ integration, onConnect }: ConnectFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; data?: unknown } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      // Validate required fields
      if (!integration.oauth) {
        const fields = (integration as FieldsIntegration).fields || [];
        const missingFields = fields.filter(f => !values[f.key]?.trim());
        if (missingFields.length > 0) {
          throw new Error(`Please fill in: ${missingFields.map(f => f.label).join(", ")}`);
        }
      }

      // Determine test endpoint based on integration type
      const isCMS = ["wordpress", "webflow", "shopify"].includes(integration.id);
      const testEndpoint = isCMS ? "/api/cms/test" : "/api/integrations/test";

      // Test the connection first
      const testResponse = await fetch(testEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cmsType: isCMS ? integration.id : undefined,
          type: !isCMS ? integration.id : undefined,
          credentials: values,
        }),
      });
      
      const testData = await testResponse.json();
      
      if (!testData.success) {
        setTestResult({ success: false, message: testData.error || "Connection test failed" });
        throw new Error(testData.error || "Connection test failed");
      }

      setTestResult({ success: true, message: testData.message || "Connection successful!", data: testData });

      // Save the integration credentials
      const saveResponse = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: integration.id,
          credentials: values,
        }),
      });
      
      const saveData = await saveResponse.json();
      
      if (!saveData.success) {
        throw new Error(saveData.error || "Failed to save credentials");
      }
      
      // Success - close dialog
      setTimeout(() => {
        onConnect();
      }, 1000);
      
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
            <Info className="mt-0.5 h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">OAuth Authentication Required</p>
              <p className="mt-1">
                You&apos;ll be redirected to Google to authorize access to your{" "}
                {integration.name} data. We only request read-only access.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => {
            window.location.href = `/api/auth/google?scopes=${encodeURIComponent(oauthIntegration.scopes.join(","))}`;
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
              className="pr-10"
            />
            {field.type === "password" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
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
      
      {testResult && (
        <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
          testResult.success 
            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}>
          {testResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {testResult.message}
        </div>
      )}
      
      {error && !testResult && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      
      <div className="rounded-lg bg-muted p-3">
        <p className="text-xs text-muted-foreground">
          <Info className="mr-1 inline h-3 w-3" />
          Your credentials are encrypted and stored securely. They are only used to connect to {integration.name} on your behalf.
        </p>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {testResult?.success ? "Saving..." : "Test & Save Connection"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations");
      const data = await response.json();
      
      if (data.success && data.integrations) {
        const statusMap: Record<string, IntegrationStatus> = {};
        for (const integration of data.integrations) {
          statusMap[integration.type] = {
            connected: integration.status === "active",
            lastChecked: integration.updated_at,
            error: integration.status === "error" ? integration.error : undefined,
          };
        }
        setStatuses(statusMap);
      }
    } catch (error) {
      console.error("Failed to fetch integration statuses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const allIntegrations = [
    ...INTEGRATIONS.ai,
    ...INTEGRATIONS.seo,
    ...INTEGRATIONS.analytics,
    ...INTEGRATIONS.publishing,
  ];
  
  const connectedCount = Object.values(statuses).filter(s => s.connected).length;
  const requiredIntegrations = allIntegrations.filter(i => i.required);
  const requiredConnected = requiredIntegrations.filter(i => statuses[i.id]?.connected).length;

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect your SEO tools, analytics, and publishing platforms</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect your SEO tools, analytics, and publishing platforms</p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold">{connectedCount}/{allIntegrations.length}</p>
              <p className="text-sm text-muted-foreground">Integrations connected</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div>
              <p className="text-2xl font-bold">{requiredConnected}/{requiredIntegrations.length}</p>
              <p className="text-sm text-muted-foreground">Required integrations</p>
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
            <p className="text-sm text-muted-foreground">
              AI models power content generation, keyword clustering, and optimization suggestions.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATIONS.ai.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                status={statuses[integration.id] || { connected: false }}
                onStatusChange={fetchStatuses}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">SEO Data Providers</h3>
            <p className="text-sm text-muted-foreground">
              These services provide keyword data, search volumes, backlinks, and SERP analysis.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATIONS.seo.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                status={statuses[integration.id] || { connected: false }}
                onStatusChange={fetchStatuses}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Analytics & Search Console</h3>
            <p className="text-sm text-muted-foreground">
              Connect your analytics to track performance and get AI-powered insights.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATIONS.analytics.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                status={statuses[integration.id] || { connected: false }}
                onStatusChange={fetchStatuses}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Publishing Platforms</h3>
            <p className="text-sm text-muted-foreground">
              Connect your CMS to publish content directly from CabbageSEO.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATIONS.publishing.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                status={statuses[integration.id] || { connected: false }}
                onStatusChange={fetchStatuses}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
