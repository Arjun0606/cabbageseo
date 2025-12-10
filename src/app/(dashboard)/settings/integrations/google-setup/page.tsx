"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  ExternalLink,
  Globe,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface GSCSite {
  siteUrl: string;
  permissionLevel: string;
}

interface GA4Property {
  name: string;
  displayName: string;
}

interface GoogleOAuthData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  gscSites: GSCSite[];
  ga4Properties: GA4Property[];
  integration: string;
}

function GoogleSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const integration = searchParams.get("integration") || "both";
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthData, setOauthData] = useState<GoogleOAuthData | null>(null);
  
  const [selectedGSCSites, setSelectedGSCSites] = useState<string[]>([]);
  const [selectedGA4Properties, setSelectedGA4Properties] = useState<string[]>([]);

  useEffect(() => {
    // Fetch OAuth data from cookie via API
    const fetchOAuthData = async () => {
      try {
        const response = await fetch("/api/auth/google/data");
        if (!response.ok) {
          throw new Error("OAuth data expired. Please try connecting again.");
        }
        const data = await response.json();
        setOauthData(data);
        
        // Auto-select first site/property
        if (data.gscSites?.length > 0) {
          setSelectedGSCSites([data.gscSites[0].siteUrl]);
        }
        if (data.ga4Properties?.length > 0) {
          setSelectedGA4Properties([data.ga4Properties[0].name]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOAuthData();
  }, []);

  const toggleGSCSite = (siteUrl: string) => {
    setSelectedGSCSites(prev => 
      prev.includes(siteUrl) 
        ? prev.filter(s => s !== siteUrl)
        : [...prev, siteUrl]
    );
  };

  const toggleGA4Property = (name: string) => {
    setSelectedGA4Properties(prev =>
      prev.includes(name)
        ? prev.filter(p => p !== name)
        : [...prev, name]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/google/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gscSites: selectedGSCSites,
          ga4Properties: selectedGA4Properties,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }
      
      // Redirect back to integrations page with success
      router.push("/settings/integrations?success=google");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader
          title="Connect Google Services"
          description="Select which properties to connect"
        />
        <div className="p-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !oauthData) {
    return (
      <div className="min-h-screen">
        <DashboardHeader
          title="Connect Google Services"
          description="Select which properties to connect"
        />
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-lg font-semibold">Connection Failed</h3>
              <p className="mb-6 text-center text-slate-500">{error}</p>
              <Button onClick={() => router.push("/settings/integrations")}>
                Back to Integrations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const showGSC = integration === "gsc" || integration === "both";
  const showGA4 = integration === "ga4" || integration === "both";

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Connect Google Services"
        description="Select which properties to connect to CabbageSEO"
      />

      <div className="mx-auto max-w-3xl p-6">
        {/* Success banner */}
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 py-4">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                Successfully connected to Google!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Now select which properties you want to connect.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GSC Sites */}
        {showGSC && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Google Search Console</CardTitle>
                  <CardDescription>
                    Select sites to track rankings, clicks, and impressions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {oauthData?.gscSites && oauthData.gscSites.length > 0 ? (
                <div className="space-y-2">
                  {oauthData.gscSites.map((site) => (
                    <div
                      key={site.siteUrl}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                        selectedGSCSites.includes(site.siteUrl)
                          ? "border-cabbage-500 bg-cabbage-50 dark:border-cabbage-700 dark:bg-cabbage-950"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => toggleGSCSite(site.siteUrl)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                          selectedGSCSites.includes(site.siteUrl)
                            ? "border-cabbage-500 bg-cabbage-500"
                            : "border-slate-300"
                        }`}>
                          {selectedGSCSites.includes(site.siteUrl) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{site.siteUrl}</p>
                          <p className="text-xs text-slate-500">
                            Permission: {site.permissionLevel}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{site.permissionLevel}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-800">
                  <p className="text-sm text-slate-500">
                    No Search Console properties found. Make sure you have access to at least one property.
                  </p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                      Go to Search Console
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* GA4 Properties */}
        {showGA4 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                  <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Google Analytics 4</CardTitle>
                  <CardDescription>
                    Select properties to track traffic and conversions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {oauthData?.ga4Properties && oauthData.ga4Properties.length > 0 ? (
                <div className="space-y-2">
                  {oauthData.ga4Properties.map((property) => (
                    <div
                      key={property.name}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                        selectedGA4Properties.includes(property.name)
                          ? "border-cabbage-500 bg-cabbage-50 dark:border-cabbage-700 dark:bg-cabbage-950"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => toggleGA4Property(property.name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                          selectedGA4Properties.includes(property.name)
                            ? "border-cabbage-500 bg-cabbage-500"
                            : "border-slate-300"
                        }`}>
                          {selectedGA4Properties.includes(property.name) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{property.displayName}</p>
                          <p className="text-xs text-slate-500">{property.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-800">
                  <p className="text-sm text-slate-500">
                    No Google Analytics properties found. Make sure you have access to at least one property.
                  </p>
                  <Button variant="link" size="sm" asChild className="mt-2">
                    <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
                      Go to Analytics
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Actions */}
        <Separator className="my-6" />
        
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/settings/integrations")}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {selectedGSCSites.length + selectedGA4Properties.length} properties selected
            </p>
            <Button
              onClick={handleSave}
              disabled={saving || (selectedGSCSites.length === 0 && selectedGA4Properties.length === 0)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Connect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function GoogleSetupLoading() {
  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Connect Google Services"
        description="Select which properties to connect"
      />
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Default export wrapped in Suspense
export default function GoogleSetupPage() {
  return (
    <Suspense fallback={<GoogleSetupLoading />}>
      <GoogleSetupContent />
    </Suspense>
  );
}
