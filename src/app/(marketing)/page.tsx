"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  FileText,
  Globe,
  BarChart3,
  Bot,
  CheckCircle2,
  Play,
  ChevronRight,
  Search,
  TrendingUp,
  Shield,
  Clock,
  Layers,
  ExternalLink,
  Eye,
  MessageSquare,
  Brain,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ============================================
// ANIMATED GRADIENT TEXT
// ============================================

function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// ============================================
// FEATURE CARD
// ============================================

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  badge?: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// PLATFORM LOGO
// ============================================

function PlatformLogo({ name, icon }: { name: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <span className="text-3xl">{icon}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}

// ============================================
// MAIN LANDING PAGE
// ============================================

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!url) return;
    setIsAnalyzing(true);
    router.push(`/analyze?url=${encodeURIComponent(url)}`);
  };

  const features = [
    {
      icon: Eye,
      title: "AI Visibility Score",
      description: "See exactly how visible your content is to ChatGPT, Perplexity, Google AI Overviews, and Bing Copilot.",
      color: "bg-purple-500/10 text-purple-500",
      badge: "Exclusive",
    },
    {
      icon: Brain,
      title: "Real Platform Tracking",
      description: "We actually query AI platforms to check if they cite your content. Not estimates - real data.",
      color: "bg-blue-500/10 text-blue-500",
      badge: "New",
    },
    {
      icon: FileText,
      title: "AI-Optimized Content",
      description: "Generate articles structured for AI citation. FAQ sections, clear definitions, quotable snippets.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Target,
      title: "SEO Audits",
      description: "Full technical SEO audits with one-click fixes. Meta tags, broken links, schema markup, and more.",
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      icon: BarChart3,
      title: "Keyword Tracking",
      description: "Track rankings across Google, monitor changes, and discover keyword opportunities.",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Globe,
      title: "Auto-Publishing",
      description: "Publish directly to WordPress, Webflow, or Shopify. One-click deployment.",
      color: "bg-pink-500/10 text-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/cabbageseo_logo.png" 
                alt="CabbageSEO" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-bold text-xl">CabbageSEO</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/analyze" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Free Tool
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Background - not too "AI-looking" */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Bot className="w-4 h-4 mr-2 text-purple-500" />
            The first SEO tool with AI visibility tracking
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Rank in <GradientText>Google</GradientText>
            <br />
            <span className="text-muted-foreground">AND</span>{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              AI Search
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            40% of Google searches now show AI Overviews. ChatGPT has 200M+ users.
            <br />
            <span className="text-foreground font-medium">
              CabbageSEO is the only tool that tracks your visibility across ALL search — traditional and AI.
            </span>
          </p>

          {/* URL Input */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="flex w-full sm:w-auto">
              <Input
                type="url"
                placeholder="Enter your website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                className="w-full sm:w-96 rounded-r-none border-r-0 h-12"
              />
              <Button 
                size="lg" 
                className="rounded-l-none gap-2 h-12 px-6"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Check My Score"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-12">
            Free instant analysis • No signup required • See your SEO + AIO scores
          </p>

          {/* AI Platforms */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">Track your visibility across:</p>
            <div className="flex items-center justify-center gap-2 md:gap-8 flex-wrap">
              <PlatformLogo name="Google AI" icon="🔍" />
              <PlatformLogo name="ChatGPT" icon="🤖" />
              <PlatformLogo name="Perplexity" icon="🔮" />
              <PlatformLogo name="Bing Copilot" icon="🪟" />
            </div>
          </div>

          {/* Hero Visual - Score Preview */}
          <div className="mt-8 relative max-w-3xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-green-500/20 to-teal-500/20 rounded-2xl blur-2xl" />
            <div className="relative bg-background border rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">example.com analysis</span>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                  Real Data
                </Badge>
              </div>
              <div className="p-6 bg-gradient-to-br from-background to-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-background border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">78</p>
                    <p className="text-xs text-muted-foreground">SEO Score</p>
                  </div>
                  <div className="bg-background border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-purple-500">64</p>
                    <p className="text-xs text-muted-foreground">AIO Score</p>
                  </div>
                  <div className="bg-background border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-500">3/4</p>
                    <p className="text-xs text-muted-foreground">Platforms Citing</p>
                  </div>
                  <div className="bg-background border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-orange-500">12</p>
                    <p className="text-xs text-muted-foreground">Issues Found</p>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <span className="text-xl">🔍</span>
                    <p className="text-lg font-bold text-green-500">✓</p>
                    <p className="text-[10px] text-muted-foreground">Google AI</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl">🤖</span>
                    <p className="text-lg font-bold text-green-500">✓</p>
                    <p className="text-[10px] text-muted-foreground">ChatGPT</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl">🔮</span>
                    <p className="text-lg font-bold text-red-500">✗</p>
                    <p className="text-[10px] text-muted-foreground">Perplexity</p>
                  </div>
                  <div className="text-center">
                    <span className="text-xl">🪟</span>
                    <p className="text-lg font-bold text-green-500">✓</p>
                    <p className="text-[10px] text-muted-foreground">Bing Copilot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">The Problem</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            AI is Changing How People Search
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-background border">
              <p className="text-4xl font-bold text-red-500 mb-2">40%</p>
              <p className="text-sm text-muted-foreground">of Google searches now show AI Overviews</p>
            </div>
            <div className="p-6 rounded-xl bg-background border">
              <p className="text-4xl font-bold text-red-500 mb-2">200M+</p>
              <p className="text-sm text-muted-foreground">weekly users on ChatGPT asking questions</p>
            </div>
            <div className="p-6 rounded-xl bg-background border">
              <p className="text-4xl font-bold text-red-500 mb-2">-25%</p>
              <p className="text-sm text-muted-foreground">average traffic drop for sites not in AI results</p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Traditional SEO tools only show you Google rankings. They don&apos;t tell you if ChatGPT, 
            Perplexity, or Google AI Overviews are citing your content.{" "}
            <span className="text-foreground font-medium">Until now.</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">
              SEO + AIO in <GradientText>One Platform</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to rank in traditional search AND get cited by AI platforms.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Comparison</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Teams Choose <GradientText>CabbageSEO</GradientText>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-2"></th>
                  <th className="text-center py-4 px-4 text-muted-foreground">Ahrefs/Semrush</th>
                  <th className="text-center py-4 px-4 text-muted-foreground">Surfer</th>
                  <th className="text-center py-4 px-4 text-green-600 font-bold">CabbageSEO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Traditional SEO", ahrefs: true, surfer: true, cabbage: true },
                  { feature: "Content Optimization", ahrefs: false, surfer: true, cabbage: true },
                  { feature: "AI Article Generation", ahrefs: false, surfer: false, cabbage: true },
                  { feature: "AIO Score", ahrefs: false, surfer: false, cabbage: true },
                  { feature: "ChatGPT Visibility", ahrefs: false, surfer: false, cabbage: true },
                  { feature: "Perplexity Visibility", ahrefs: false, surfer: false, cabbage: true },
                  { feature: "Google AI Overviews", ahrefs: false, surfer: false, cabbage: true },
                  { feature: "Starting Price", ahrefs: "$99/mo", surfer: "$89/mo", cabbage: "$29/mo" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : ""}>
                    <td className="py-3 px-2 font-medium">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {typeof row.ahrefs === "boolean" ? (
                        row.ahrefs ? <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className="text-muted-foreground">{row.ahrefs}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.surfer === "boolean" ? (
                        row.surfer ? <CheckCircle2 className="w-5 h-5 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className="text-muted-foreground">{row.surfer}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.cabbage === "boolean" ? (
                        row.cabbage ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <span className="text-green-600 font-bold">{row.cabbage}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Three Steps to <GradientText>AI Visibility</GradientText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <div className="text-sm text-purple-500 font-medium mb-2">Step 1</div>
              <h3 className="text-xl font-bold mb-2">Analyze Your Site</h3>
              <p className="text-muted-foreground text-sm">
                Enter your URL. We scan your content and check visibility across all AI platforms.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <div className="text-sm text-green-500 font-medium mb-2">Step 2</div>
              <h3 className="text-xl font-bold mb-2">Fix Issues</h3>
              <p className="text-muted-foreground text-sm">
                Get specific recommendations to improve both SEO and AIO. One-click fixes available.
              </p>
                </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-sm text-blue-500 font-medium mb-2">Step 3</div>
              <h3 className="text-xl font-bold mb-2">Get Cited</h3>
              <p className="text-muted-foreground text-sm">
                Watch as AI platforms start citing your content. Track every mention in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-green-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-background border rounded-2xl p-12">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/10 to-green-500/10 rounded-2xl mb-6">
                <Bot className="w-10 h-10 text-purple-500" />
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Is AI Citing <GradientText>Your Content</GradientText>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Find out in 30 seconds. Free analysis, no signup required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="gap-2 px-8" asChild>
                  <Link href="/analyze">
                    Check My Visibility
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img 
                src="/cabbageseo_logo.png" 
                alt="CabbageSEO" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-bold text-xl">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/analyze" className="hover:text-foreground transition-colors">Free Tool</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CabbageSEO. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
