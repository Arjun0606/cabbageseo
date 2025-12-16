"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-6 relative">
        <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// STEP CARD
// ============================================

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          {number}
        </div>
        {number < 4 && <div className="w-0.5 h-full bg-border mt-2" />}
      </div>
      <div className="pb-8">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

// ============================================
// MAIN LANDING PAGE
// ============================================

export default function LandingPage() {
  const [email, setEmail] = useState("");

  const features = [
    {
      icon: Target,
      title: "AI Keyword Research",
      description: "Discover untapped keyword opportunities with AI-powered analysis. Find low-competition, high-value keywords in seconds.",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: FileText,
      title: "Content Generation",
      description: "Generate SEO-optimized articles in minutes. Complete with headings, meta tags, FAQ schema, and internal linking suggestions.",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon: Zap,
      title: "Technical Audit",
      description: "Scan your site for 100+ SEO issues. Get one-click fixes for meta tags, broken links, and performance problems.",
      color: "bg-yellow-500/10 text-yellow-500",
    },
    {
      icon: Globe,
      title: "Auto-Publishing",
      description: "Connect WordPress, Webflow, or Shopify. Publish optimized content directly to your CMS with one click.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: BarChart3,
      title: "Rank Tracking",
      description: "Monitor your rankings across all keywords. Get alerts when positions change and track competitor movements.",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      icon: Bot,
      title: "SEO Autopilot",
      description: "Set it and forget it. Our AI continuously monitors, optimizes, and improves your SEO while you focus on your business.",
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
              <Image src="/logo.png" alt="CabbageSEO" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-xl">CabbageSEO</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
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
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            AI-Powered SEO Automation
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            SEO on <GradientText>Autopilot</GradientText>
            <br />
            <span className="text-muted-foreground">Results Without the Hustle</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop wasting hours on SEO. CabbageSEO uses AI to research keywords, generate content, 
            fix issues, and grow your organic traffic — all while you sleep.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex w-full sm:w-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-80 rounded-r-none border-r-0"
              />
              <Button size="lg" className="rounded-l-none gap-2">
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Free homepage analysis • Plans from $29/mo • Cancel anytime
          </p>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl blur-2xl" />
            <div className="relative bg-background border rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">CabbageSEO Dashboard</span>
              </div>
              <div className="p-6 bg-gradient-to-br from-background to-muted/30">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Keywords", value: "1,247", change: "+12%" },
                    { label: "Content", value: "48", change: "+8%" },
                    { label: "Avg. Position", value: "14.3", change: "-2.1" },
                    { label: "Issues Fixed", value: "156", change: "Auto" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-background border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xs text-green-500">{stat.change}</p>
                    </div>
                  ))}
                </div>
                <div className="h-32 bg-gradient-to-r from-green-500/20 via-emerald-500/30 to-teal-500/20 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <Bot className="w-8 h-8 text-primary animate-pulse" />
                    <span className="text-lg font-medium">Autopilot is running...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need for <GradientText>SEO Success</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve combined the best SEO tools into one intelligent platform. 
              No more juggling multiple subscriptions or learning complex workflows.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-bold mb-4">
              From Zero to Rankings in <GradientText>4 Simple Steps</GradientText>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No SEO expertise required. Just connect your site and let our AI do the heavy lifting.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <StepCard
                number={1}
                title="Connect Your Website"
                description="Paste your URL and we'll automatically scan your site, discover all pages, and analyze your current SEO status."
              />
              <StepCard
                number={2}
                title="AI Discovers Opportunities"
                description="Our AI analyzes your niche, finds keyword gaps, identifies quick wins, and creates a personalized SEO strategy."
              />
              <StepCard
                number={3}
                title="Generate & Publish Content"
                description="Click to generate SEO-optimized articles. Publish directly to your CMS or export as HTML/Markdown."
              />
              <StepCard
                number={4}
                title="Watch Rankings Climb"
                description="Track your progress as our autopilot continuously optimizes, fixes issues, and grows your organic traffic."
              />
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-2xl blur-xl" />
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Analysis Complete</p>
                      <p className="text-sm text-muted-foreground">Found 23 opportunities</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { icon: Search, text: "156 keywords discovered", color: "text-purple-500" },
                      { icon: FileText, text: "8 content ideas generated", color: "text-blue-500" },
                      { icon: Zap, text: "5 quick wins identified", color: "text-yellow-500" },
                      { icon: TrendingUp, text: "Ranking potential: +340%", color: "text-green-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className="text-sm">{item.text}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                      </div>
                    ))}
                  </div>

                  <Button className="w-full mt-6 gap-2">
                    <Bot className="w-4 h-4" />
                    Start Autopilot
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Why CabbageSEO</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Built for <GradientText>Real Results</GradientText>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "Save 20+ Hours/Week", desc: "Automate repetitive SEO tasks" },
              { icon: Shield, title: "No Expertise Needed", desc: "AI handles the complexity" },
              { icon: Layers, title: "All-in-One Platform", desc: "Replace 5+ separate tools" },
              { icon: TrendingUp, title: "Proven Results", desc: "Data-driven optimization" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-background border rounded-2xl p-12">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Ready to Put Your SEO on <GradientText>Autopilot</GradientText>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of businesses using CabbageSEO to grow their organic traffic. 
                Try the free homepage analyzer above, then unlock full access.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="gap-2 px-8" asChild>
                  <Link href="/signup">
                    Get Full Access
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link href="/onboarding">
                    <Play className="w-5 h-5" />
                    See It in Action
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
              <Image src="/logo.png" alt="CabbageSEO" width={32} height={32} className="rounded-lg" />
              <span className="font-bold text-xl">CabbageSEO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
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

