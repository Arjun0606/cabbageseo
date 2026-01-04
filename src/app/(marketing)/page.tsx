"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  Search,
  Bot,
  Sparkles,
  Check,
  Bell,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  Shield,
  Globe,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// ============================================
// CITATION INTELLIGENCE LANDING PAGE
// ============================================

// AI Platforms we track
const aiPlatforms = [
  { name: "Perplexity", icon: Search, color: "text-purple-400", desc: "Real API" },
  { name: "Google AI", icon: Sparkles, color: "text-blue-400", desc: "Gemini grounding" },
  { name: "ChatGPT", icon: Bot, color: "text-green-400", desc: "SearchGPT ready" },
];

// Pricing plans
const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Try it out",
    popular: false,
    features: [
      "1 website",
      "3 citation checks/day",
      "7-day history",
      "Basic alerts",
    ],
    limitations: [
      "No competitor tracking",
      "No API access",
    ],
    cta: "Start Free",
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    yearlyPrice: 24,
    description: "For solopreneurs",
    popular: false,
    features: [
      "3 websites",
      "100 checks/month",
      "30-day history",
      "2 competitors",
      "Real-time alerts",
      "CSV export",
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    yearlyPrice: 66,
    description: "For growing businesses",
    popular: true,
    features: [
      "10 websites",
      "Unlimited checks",
      "Unlimited history",
      "10 competitors",
      "Hourly monitoring",
      "API access",
      "Priority support",
    ],
    cta: "Go Pro",
  },
  {
    id: "agency",
    name: "Agency",
    price: 199,
    yearlyPrice: 166,
    description: "For agencies",
    popular: false,
    features: [
      "50 websites",
      "Unlimited everything",
      "Unlimited competitors",
      "White-label reports",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
  },
];

// Features
const features = [
  {
    icon: Eye,
    title: "Real Citation Tracking",
    description: "Know the exact moment AI starts citing your website. We check Perplexity, Google AI, and ChatGPT.",
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Get notified via email when you gain or lose a citation. Never miss an AI mention again.",
  },
  {
    icon: Target,
    title: "Competitor Intelligence",
    description: "Track your competitors' AI visibility. See who's winning in your niche.",
  },
  {
    icon: TrendingUp,
    title: "Historical Trends",
    description: "Watch your AI visibility grow over time. Export reports for stakeholders.",
  },
  {
    icon: BarChart3,
    title: "Platform Breakdown",
    description: "See which AI platforms cite you most. Optimize your strategy accordingly.",
  },
  {
    icon: Clock,
    title: "Scheduled Checks",
    description: "We monitor continuously so you don't have to. Daily or hourly checks available.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
        }
      }
    };
    checkAuth();
  }, []);

  const handleCheck = async () => {
    if (!url.trim()) return;
    
    setIsChecking(true);
    
    // Clean URL
    let domain = url.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    
    // Redirect to analyze page
    router.push(`/analyze?url=${encodeURIComponent(domain)}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* HEADER */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-10 w-auto" />
            <span className="font-bold text-xl tracking-tight text-white">CabbageSEO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-zinc-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/feedback" className="text-zinc-400 hover:text-white transition-colors">Feedback</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-600 hover:bg-emerald-500">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-emerald-600 hover:bg-emerald-500">Start Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-6">
            <Eye className="w-3 h-3 mr-1" />
            Citation Intelligence Platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Know When AI <span className="text-emerald-400">Cites</span> Your Website
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Track when ChatGPT, Perplexity, and Google AI mention your website. 
            Get alerts, monitor competitors, and grow your AI visibility.
          </p>

          {/* CTA INPUT */}
          <div className="max-w-lg mx-auto mb-8">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your website..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                className="bg-zinc-900 border-zinc-700 text-white h-12"
              />
              <Button
                onClick={handleCheck}
                disabled={isChecking}
                className="bg-emerald-600 hover:bg-emerald-500 h-12 px-6"
              >
                {isChecking ? "Checking..." : "Check Now"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Free check • No signup required
            </p>
          </div>

          {/* PLATFORMS */}
          <div className="flex justify-center gap-6 mb-12">
            {aiPlatforms.map((platform) => (
              <div key={platform.name} className="flex items-center gap-2 text-zinc-400">
                <platform.icon className={`w-5 h-5 ${platform.color}`} />
                <span>{platform.name}</span>
              </div>
            ))}
          </div>

          {/* SOCIAL PROOF */}
          <div className="flex items-center justify-center gap-8 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Real API integrations
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Instant alerts
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Competitor tracking
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-400">Simple, powerful citation intelligence</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Add Your Website</h3>
              <p className="text-zinc-400">Enter your domain and we start monitoring immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">2. We Check AI Platforms</h3>
              <p className="text-zinc-400">Daily or hourly checks across Perplexity, Google AI, and ChatGPT.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Get Notified</h3>
              <p className="text-zinc-400">Instant alerts when AI mentions your website.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-zinc-400">Complete citation intelligence toolkit</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <feature.icon className="w-10 h-10 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-zinc-400 mb-6">Start free, upgrade when you need more</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <span className={`text-sm ${!isYearly ? "text-white" : "text-zinc-500"}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isYearly ? "bg-emerald-600" : "bg-zinc-700"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isYearly ? "translate-x-6" : ""}`} />
              </button>
              <span className={`text-sm ${isYearly ? "text-white" : "text-zinc-500"}`}>
                Yearly <Badge className="bg-emerald-500/20 text-emerald-400 ml-1">Save 20%</Badge>
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map((plan) => (
              <Card key={plan.id} className={`bg-zinc-900 border-zinc-800 ${plan.popular ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`}>
                <CardContent className="pt-6">
                  {plan.popular && (
                    <Badge className="bg-emerald-500 text-white mb-4">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                    </span>
                    {plan.price > 0 && <span className="text-zinc-500">/mo</span>}
                  </div>
                  
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.limitations?.map((limitation, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                        <span className="w-4 h-4 flex items-center justify-center shrink-0">—</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={plan.id === "free" ? "/signup" : "/pricing"}>
                    <Button 
                      className={`w-full ${plan.popular ? "bg-emerald-600 hover:bg-emerald-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Tracking Your AI Citations Today
          </h2>
          <p className="text-zinc-400 mb-8">
            Free to start. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
              <Eye className="w-5 h-5 mr-2" />
              Start Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8 w-auto" />
              <span className="font-bold text-white">CabbageSEO</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/pricing" className="hover:text-white">Pricing</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/feedback" className="hover:text-white">Feedback</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
            </nav>
            <div className="text-sm text-zinc-500">
              <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                𝕏 @Arjun06061
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} CabbageSEO. Citation Intelligence for the AI era.
          </div>
        </div>
      </footer>
    </div>
  );
}
