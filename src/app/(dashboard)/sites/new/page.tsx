"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Zap,
  Search,
  FileText,
  Link2,
  Shield,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

// Steps
const STEPS = [
  { id: "url", title: "Enter URL", description: "Add your website URL" },
  { id: "verify", title: "Verify Ownership", description: "Prove you own this site" },
  { id: "scan", title: "Initial Scan", description: "Analyze your site" },
  { id: "connect", title: "Connect Services", description: "Link GSC & GA4" },
  { id: "complete", title: "Complete", description: "Start optimizing" },
];

// Verification methods
const VERIFICATION_METHODS = [
  {
    id: "dns",
    title: "DNS TXT Record",
    description: "Add a TXT record to your domain's DNS",
    recommended: true,
  },
  {
    id: "html",
    title: "HTML File",
    description: "Upload a verification file to your site",
    recommended: false,
  },
  {
    id: "meta",
    title: "Meta Tag",
    description: "Add a meta tag to your homepage",
    recommended: false,
  },
  {
    id: "gsc",
    title: "Google Search Console",
    description: "Verify via your connected GSC account",
    recommended: false,
  },
];

export default function NewSitePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [url, setUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationMethod, setVerificationMethod] = useState("dns");
  const [scanResults, setScanResults] = useState<{
    pages: number;
    keywords: number;
    issues: number;
    score: number;
  } | null>(null);

  const handleUrlSubmit = () => {
    if (!url.trim()) return;
    setCurrentStep(1);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate verification
    await new Promise(r => setTimeout(r, 2000));
    setIsVerifying(false);
    setCurrentStep(2);
    handleScan();
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 80));
      setScanProgress(i);
    }
    
    setScanResults({
      pages: 47,
      keywords: 23,
      issues: 12,
      score: 67,
    });
    setIsScanning(false);
    setCurrentStep(3);
  };

  const handleConnectServices = () => {
    setCurrentStep(4);
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="max-w-xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cabbage-100 text-cabbage-700 dark:bg-cabbage-900 dark:text-cabbage-300">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Add New Site</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Enter your website URL
              </h1>
              <p className="text-slate-500">
                We'll analyze your site and create a personalized SEO strategy
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className="pl-12 h-14 text-lg"
                />
              </div>
              <Button 
                size="lg" 
                onClick={handleUrlSubmit}
                disabled={!url.trim()}
                className="w-full h-14 text-lg gap-2"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              By adding your site, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        );

      case 1:
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Verify Ownership</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Verify you own {new URL(url.startsWith("http") ? url : `https://${url}`).hostname}
              </h1>
              <p className="text-slate-500">
                Choose a verification method to prove site ownership
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {VERIFICATION_METHODS.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setVerificationMethod(method.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    verificationMethod === method.id
                      ? "border-cabbage-500 bg-cabbage-50 dark:bg-cabbage-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{method.title}</h3>
                    {method.recommended && (
                      <Badge className="bg-cabbage-500 text-white">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{method.description}</p>
                </div>
              ))}
            </div>

            {verificationMethod === "dns" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">DNS Verification</CardTitle>
                  <CardDescription>Add this TXT record to your domain's DNS settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500">Type:</span>
                      <span className="font-semibold">TXT</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-semibold">@</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Value:</span>
                      <span className="font-semibold text-xs">cabbageseo-verify=abc123xyz789</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    DNS changes can take up to 48 hours to propagate, but usually happen within minutes.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex-1 gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Ownership
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-cabbage-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cabbage-500 to-cabbage-600 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Scanning your site...
              </h2>
              <p className="text-slate-500">
                Analyzing pages, keywords, and SEO opportunities
              </p>
            </div>

            <div className="space-y-4">
              <Progress value={scanProgress} className="h-2" />
              <p className="text-sm text-slate-400">{scanProgress}% complete</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                { label: "Pages found", icon: FileText, done: scanProgress > 25 },
                { label: "Keywords analyzed", icon: Search, done: scanProgress > 50 },
                { label: "Links checked", icon: Link2, done: scanProgress > 75 },
                { label: "Score calculated", icon: Zap, done: scanProgress === 100 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-cabbage-500 animate-spin" />
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Scan Complete</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Connect your analytics
              </h1>
              <p className="text-slate-500">
                Link Google Search Console and Analytics for deeper insights
              </p>
            </div>

            {/* Scan Results Summary */}
            {scanResults && (
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{scanResults.pages}</p>
                    <p className="text-sm text-slate-500">Pages</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{scanResults.keywords}</p>
                    <p className="text-sm text-slate-500">Keywords</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-orange-600">{scanResults.issues}</p>
                    <p className="text-sm text-slate-500">Issues</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-cabbage-600">{scanResults.score}</p>
                    <p className="text-sm text-slate-500">Score</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Connect Services */}
            <div className="space-y-4">
              <Card className="border-2 hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Google Search Console</h3>
                      <p className="text-sm text-slate-500">Get detailed search performance data</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Google Analytics 4</h3>
                      <p className="text-sm text-slate-500">Track user behavior and conversions</p>
                    </div>
                    <Button variant="outline">Connect</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleConnectServices} className="flex-1">
                Skip for Now
              </Button>
              <Button onClick={handleConnectServices} className="flex-1 gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                You're all set! 🎉
              </h1>
              <p className="text-slate-500">
                Your site has been added and the initial scan is complete. CabbageSEO Autopilot is now active.
              </p>
            </div>

            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cabbage-600" />
                  What's Next
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cabbage-500 text-white text-xs flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <p className="font-medium">Review your SEO audit</p>
                    <p className="text-sm text-slate-500">We found {scanResults?.issues} issues that need attention</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cabbage-500 text-white text-xs flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <p className="font-medium">Explore keyword opportunities</p>
                    <p className="text-sm text-slate-500">We discovered {scanResults?.keywords} potential keywords</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cabbage-500 text-white text-xs flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <p className="font-medium">Let Autopilot do the work</p>
                    <p className="text-sm text-slate-500">We'll continuously optimize your site</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button size="lg" onClick={handleComplete} className="gap-2">
              <Zap className="h-5 w-5" />
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cabbage-50 dark:from-slate-950 dark:via-slate-900 dark:to-cabbage-950">
      {/* Progress Steps */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < currentStep
                      ? "bg-cabbage-500 text-white"
                      : i === currentStep
                        ? "bg-cabbage-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {i < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-sm hidden md:block ${
                    i <= currentStep ? "text-slate-900 dark:text-white font-medium" : "text-slate-500"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-px mx-2 ${
                    i < currentStep ? "bg-cabbage-500" : "bg-slate-200 dark:bg-slate-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto px-6 py-12">
        {renderStep()}
      </div>
    </div>
  );
}

