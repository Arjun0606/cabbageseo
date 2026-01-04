"use client";

import Link from "next/link";
import {
  Eye,
  Search,
  Bot,
  Sparkles,
  Bell,
  Target,
  ArrowRight,
  CheckCircle2,
  Globe,
  Clock,
  Zap,
  BarChart3,
  Users,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============================================
// HOW IT WORKS - CITATION INTELLIGENCE
// ============================================

const steps = [
  {
    number: "01",
    title: "Add Your Website",
    description: "Enter your domain and we start monitoring immediately. No code installation required.",
    icon: Globe,
  },
  {
    number: "02",
    title: "We Query AI Platforms",
    description: "We ask ChatGPT, Perplexity, and Google AI questions related to your domain and industry.",
    icon: Search,
  },
  {
    number: "03",
    title: "Detect Citations",
    description: "When AI mentions your website, we capture the query, snippet, and context.",
    icon: Eye,
  },
  {
    number: "04",
    title: "Get Notified",
    description: "Instant alerts when you're cited. Weekly reports show your progress over time.",
    icon: Bell,
  },
];

const platforms = [
  {
    name: "Perplexity",
    icon: Search,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    description: "Real API with citation URLs",
    accuracy: "100%",
  },
  {
    name: "Google AI",
    icon: Sparkles,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description: "Gemini with search grounding",
    accuracy: "95%",
  },
  {
    name: "ChatGPT",
    icon: Bot,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    description: "OpenAI query simulation",
    accuracy: "90%",
  },
];

const useCases = [
  {
    title: "For Marketers",
    description: "Track your brand's AI visibility without any technical setup.",
    steps: [
      "Run free analysis at /analyze",
      "Sign up and add your site",
      "Monitor citations daily",
      "Share reports with stakeholders",
    ],
    cta: "Start Free Analysis",
    href: "/analyze",
  },
  {
    title: "For Founders",
    description: "Know when AI recommends your product over competitors.",
    steps: [
      "Add your domain",
      "Add competitor domains",
      "Compare AI visibility",
      "Track changes over time",
    ],
    cta: "Track Your Startup",
    href: "/signup",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-white">CabbageSEO</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" className="text-zinc-400">Pricing</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-500">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-6">
          How It Works
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Citation Intelligence in 4 Steps
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Track when ChatGPT, Perplexity, and Google AI mention your website. 
          No code required. Results in minutes.
        </p>
      </section>

      {/* Steps */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full">
                  <span className="text-4xl font-bold text-zinc-800">{step.number}</span>
                  <step.icon className="w-8 h-8 text-emerald-400 mt-4 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-zinc-400 text-sm">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-zinc-700">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Platforms We Monitor</h2>
            <p className="text-zinc-400">Real integrations, not just estimates</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {platforms.map((platform, i) => (
              <Card key={i} className={`bg-zinc-900 border ${platform.color.includes("border") ? platform.color.split(" ").find(c => c.includes("border")) : "border-zinc-800"}`}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center mb-4`}>
                    <platform.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{platform.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{platform.description}</p>
                  <Badge variant="outline" className="border-zinc-700">
                    {platform.accuracy} accuracy
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">What You Get</h2>
            <p className="text-zinc-400">Everything you need to track AI visibility</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <BarChart3 className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Dashboard</h3>
              <p className="text-zinc-400 text-sm">See your citation count, trends, and platform breakdown at a glance.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Bell className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Alerts</h3>
              <p className="text-zinc-400 text-sm">Email notifications when you gain or lose citations.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Target className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Competitor Tracking</h3>
              <p className="text-zinc-400 text-sm">Monitor competitors and compare AI visibility.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Clock className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Historical Data</h3>
              <p className="text-zinc-400 text-sm">Track your progress over time with unlimited history.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Zap className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Automated Checks</h3>
              <p className="text-zinc-400 text-sm">Daily or hourly monitoring based on your plan.</p>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <Shield className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">CSV Export</h3>
              <p className="text-zinc-400 text-sm">Export your data for reporting and analysis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Who It's For</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-xl text-white">{useCase.title}</CardTitle>
                  <p className="text-zinc-400 text-sm">{useCase.description}</p>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 mb-6">
                    {useCase.steps.map((step, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-zinc-300">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                          {j + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <Link href={useCase.href}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                      {useCase.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Track Your AI Citations?
        </h2>
        <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
          Start free. See if AI platforms know about your website. No credit card required.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/analyze">
            <Button size="lg" variant="outline" className="border-zinc-700">
              Free Analysis
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
              <Eye className="w-5 h-5 mr-2" />
              Start Tracking
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8 w-auto" />
            <span className="font-bold text-white">CabbageSEO</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/feedback" className="hover:text-white">Feedback</Link>
            <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="hover:text-white">𝕏 @Arjun06061</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
