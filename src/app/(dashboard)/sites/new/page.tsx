"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Link2,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

// ============================================
// TYPES
// ============================================

interface SiteData {
  domain: string;
  name: string;
  cmsType: "wordpress" | "webflow" | "shopify" | "other" | "";
  cmsCredentials: Record<string, string>;
  gscConnected: boolean;
  ga4Connected: boolean;
  brandVoice: string;
  targetAudience: string;
  mainTopics: string[];
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              index < currentStep
                ? "bg-primary text-primary-foreground"
                : index === currentStep
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {index < currentStep ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 mx-2 rounded ${
                index < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// STEP 1: BASIC INFO
// ============================================

function Step1BasicInfo({
  data,
  onChange,
}: {
  data: SiteData;
  onChange: (updates: Partial<SiteData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Add Your Website</h2>
        <p className="text-muted-foreground">Let&apos;s start with the basics</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="domain">Website URL</Label>
          <Input
            id="domain"
            placeholder="example.com"
            value={data.domain}
            onChange={(e) => onChange({ domain: e.target.value })}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">
            Enter your domain without http:// or https://
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Site Name</Label>
          <Input
            id="name"
            placeholder="My Awesome Website"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            A friendly name to identify this site
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 2: CMS CONNECTION
// ============================================

function Step2CMS({
  data,
  onChange,
}: {
  data: SiteData;
  onChange: (updates: Partial<SiteData>) => void;
}) {
  const cmsOptions = [
    {
      id: "wordpress",
      name: "WordPress",
      description: "Self-hosted or WordPress.com",
      icon: "🔵",
    },
    {
      id: "webflow",
      name: "Webflow",
      description: "Visual web design platform",
      icon: "🔷",
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "E-commerce platform",
      icon: "🛒",
    },
    {
      id: "other",
      name: "Other / None",
      description: "Manual publishing or custom CMS",
      icon: "📝",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
          <Link2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Connect Your CMS</h2>
        <p className="text-muted-foreground">
          Auto-publish content directly to your site
        </p>
      </div>

      <RadioGroup
        value={data.cmsType}
        onValueChange={(value: string) => onChange({ cmsType: value as SiteData["cmsType"] })}
        className="grid grid-cols-2 gap-4"
      >
        {cmsOptions.map((cms) => (
          <Label
            key={cms.id}
            htmlFor={cms.id}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              data.cmsType === cms.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <RadioGroupItem value={cms.id} id={cms.id} className="sr-only" />
            <span className="text-2xl">{cms.icon}</span>
            <div>
              <p className="font-medium">{cms.name}</p>
              <p className="text-xs text-muted-foreground">{cms.description}</p>
            </div>
          </Label>
        ))}
      </RadioGroup>

      {data.cmsType === "wordpress" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">WordPress Credentials</CardTitle>
            <CardDescription>
              Use an Application Password for secure access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site URL</Label>
              <Input
                placeholder="https://yourblog.com"
                value={data.cmsCredentials.siteUrl || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, siteUrl: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="admin"
                value={data.cmsCredentials.username || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, username: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Application Password</Label>
              <Input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                value={data.cmsCredentials.appPassword || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, appPassword: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Generate one in WordPress: Users → Your Profile → Application Passwords
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.cmsType === "webflow" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Webflow API Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                type="password"
                placeholder="Your Webflow API token"
                value={data.cmsCredentials.accessToken || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, accessToken: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Get it from Webflow: Site Settings → Integrations → API Access
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.cmsType === "shopify" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Shopify Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Shop Domain</Label>
              <Input
                placeholder="your-store.myshopify.com"
                value={data.cmsCredentials.shopDomain || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, shopDomain: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                type="password"
                placeholder="shpat_xxxxx"
                value={data.cmsCredentials.accessToken || ""}
                onChange={(e) =>
                  onChange({
                    cmsCredentials: { ...data.cmsCredentials, accessToken: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Create a Custom App in Shopify Admin → Settings → Apps
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.cmsType === "other" && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No problem! You can manually copy and publish content, or export as
              HTML/Markdown.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// STEP 3: ANALYTICS
// ============================================

function Step3Analytics({
  data,
  onChange,
}: {
  data: SiteData;
  onChange: (updates: Partial<SiteData>) => void;
}) {
  const [isConnecting, setIsConnecting] = useState<"gsc" | "ga4" | null>(null);

  const connectGoogle = async (type: "gsc" | "ga4") => {
    setIsConnecting(type);
    // In production, this would redirect to Google OAuth
    await new Promise((r) => setTimeout(r, 1500));
    onChange(type === "gsc" ? { gscConnected: true } : { ga4Connected: true });
    setIsConnecting(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Connect Analytics</h2>
        <p className="text-muted-foreground">
          Get insights from Google Search Console & Analytics
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className={`p-6 ${
            data.gscConnected ? "border-green-500 bg-green-500/5" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              </div>
              <div>
                <p className="font-medium">Google Search Console</p>
                <p className="text-sm text-muted-foreground">
                  Track rankings, clicks & impressions
                </p>
              </div>
            </div>
            {data.gscConnected ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button
                onClick={() => connectGoogle("gsc")}
                disabled={isConnecting === "gsc"}
              >
                {isConnecting === "gsc" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Connect
              </Button>
            )}
          </div>
        </Card>

        <Card
          className={`p-6 ${
            data.ga4Connected ? "border-green-500 bg-green-500/5" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Google Analytics 4</p>
                <p className="text-sm text-muted-foreground">
                  Track traffic, users & conversions
                </p>
              </div>
            </div>
            {data.ga4Connected ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button
                onClick={() => connectGoogle("ga4")}
                disabled={isConnecting === "ga4"}
              >
                {isConnecting === "ga4" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Connect
              </Button>
            )}
          </div>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        You can skip this step and connect later in Settings
      </p>
    </div>
  );
}

// ============================================
// STEP 4: BRAND VOICE
// ============================================

function Step4BrandVoice({
  data,
  onChange,
}: {
  data: SiteData;
  onChange: (updates: Partial<SiteData>) => void;
}) {
  const voicePresets = [
    { id: "professional", label: "Professional", desc: "Formal, authoritative, expert" },
    { id: "friendly", label: "Friendly", desc: "Warm, conversational, approachable" },
    { id: "casual", label: "Casual", desc: "Relaxed, informal, fun" },
    { id: "technical", label: "Technical", desc: "Detailed, precise, analytical" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Define Your Voice</h2>
        <p className="text-muted-foreground">
          Help AI write content that sounds like you
        </p>
      </div>

      <div className="space-y-4">
        <Label>Writing Style</Label>
        <div className="grid grid-cols-2 gap-3">
          {voicePresets.map((preset) => (
            <Button
              key={preset.id}
              variant={data.brandVoice === preset.id ? "default" : "outline"}
              className="h-auto py-3 justify-start"
              onClick={() => onChange({ brandVoice: preset.id })}
            >
              <div className="text-left">
                <p className="font-medium">{preset.label}</p>
                <p className="text-xs opacity-70">{preset.desc}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">Target Audience</Label>
        <Input
          id="audience"
          placeholder="e.g., Small business owners, marketing managers"
          value={data.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topics">Main Topics (comma-separated)</Label>
        <Textarea
          id="topics"
          placeholder="e.g., SEO, content marketing, digital strategy"
          value={data.mainTopics.join(", ")}
          onChange={(e) =>
            onChange({
              mainTopics: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
            })
          }
          rows={3}
        />
      </div>
    </div>
  );
}

// ============================================
// STEP 5: COMPLETE
// ============================================

function Step5Complete({ data }: { data: SiteData }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Create the site via API
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: data.domain,
          name: data.name || data.domain,
          settings: {
            cmsType: data.cmsType,
            brandVoice: data.brandVoice,
            targetAudience: data.targetAudience,
            mainTopics: data.mainTopics,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create site");
      }
      
      // Navigate to dashboard on success
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      // Always reset loading state, whether success or failure
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center p-4 bg-green-500/10 rounded-full mb-4">
        <Sparkles className="w-12 h-12 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold">You&apos;re All Set! 🎉</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        CabbageSEO is ready to help you dominate search rankings for{" "}
        <span className="font-medium text-foreground">{data.domain}</span>
      </p>

      <Card className="text-left max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>Site: {data.name || data.domain}</span>
          </div>
          {data.cmsType && data.cmsType !== "other" && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>CMS: {data.cmsType} connected</span>
            </div>
          )}
          {data.gscConnected && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Google Search Console connected</span>
            </div>
          )}
          {data.ga4Connected && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Google Analytics 4 connected</span>
            </div>
          )}
          {data.brandVoice && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Brand voice: {data.brandVoice}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      <Button
        size="lg"
        onClick={handleCreate}
        disabled={isCreating}
        className="gap-2"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Start My SEO Journey
          </>
        )}
      </Button>
    </div>
  );
}

// ============================================
// MAIN WIZARD
// ============================================

export default function NewSitePage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SiteData>({
    domain: "",
    name: "",
    cmsType: "",
    cmsCredentials: {},
    gscConnected: false,
    ga4Connected: false,
    brandVoice: "",
    targetAudience: "",
    mainTopics: [],
  });

  const steps = ["Basics", "CMS", "Analytics", "Voice", "Complete"];

  const updateData = (updates: Partial<SiteData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.domain.trim().length > 0;
      case 1:
        return data.cmsType !== "";
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step1BasicInfo data={data} onChange={updateData} />;
      case 1:
        return <Step2CMS data={data} onChange={updateData} />;
      case 2:
        return <Step3Analytics data={data} onChange={updateData} />;
      case 3:
        return <Step4BrandVoice data={data} onChange={updateData} />;
      case 4:
        return <Step5Complete data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <StepIndicator steps={steps} currentStep={step} />

      <Card className="p-8">
        {renderStep()}

        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed()}
            >
              {step === 3 ? "Finish" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
