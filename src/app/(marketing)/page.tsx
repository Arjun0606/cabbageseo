"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  Eye,
  Brain,
  FileText,
  Target,
  BarChart3,
  Globe,
  Check,
  ChevronRight,
  Zap,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExitIntentPopup } from "@/components/marketing/exit-intent-popup";

// ============================================
// LANDING PAGE - Clean, Professional, AIO-First
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/cabbageseo_logo.png" 
                alt="CabbageSEO" 
                className="h-10 w-auto"
              />
              <span className="font-bold text-xl tracking-tight">CabbageSEO</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/analyze" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Free Tool
              </Link>
              <Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Pricing
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            The first SEO tool with AI visibility tracking
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Rank in Google.
            <br />
            <span className="text-emerald-400">Get cited by AI.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ChatGPT, Perplexity, and Google AI Overviews are answering questions 
            with your competitors&apos; content. CabbageSEO helps you get in there.
          </p>

          {/* URL Input */}
          <div className="max-w-xl mx-auto mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="url"
                  placeholder="Enter your website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="w-full h-14 pl-12 pr-4 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                />
              </div>
              <Button 
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-zinc-500">
            Free instant analysis • No signup required
          </p>

          {/* Social proof */}
          <div className="mt-12 flex flex-col items-center">
            <div className="flex -space-x-2 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-zinc-950 flex items-center justify-center text-xs font-bold text-zinc-950"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-zinc-400">
              Trusted by <span className="text-white font-medium">500+</span> SEO professionals
            </p>
          </div>
        </div>
      </section>

      {/* Score Preview */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <span className="text-sm text-zinc-500">example.com</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">✓ Real data</span>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-emerald-400 mb-1">78</p>
                  <p className="text-sm text-zinc-500">SEO Score</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-400 mb-1">64</p>
                  <p className="text-sm text-zinc-500">AIO Score</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-400 mb-1">3/4</p>
                  <p className="text-sm text-zinc-500">AI Platforms</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-amber-400 mb-1">12</p>
                  <p className="text-sm text-zinc-500">Issues</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400">Google AI</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400">ChatGPT</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-400">Bing Copilot</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            AI is eating Google&apos;s traffic.
          </h2>
          <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
            40% of Google searches now show AI Overviews. ChatGPT has 200M+ weekly users. 
            Traditional SEO tools don&apos;t track any of this.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-4xl font-bold text-red-400 mb-2">40%</p>
              <p className="text-sm text-zinc-500">of Google searches show AI Overviews</p>
            </div>
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-4xl font-bold text-red-400 mb-2">200M+</p>
              <p className="text-sm text-zinc-500">weekly users asking ChatGPT questions</p>
            </div>
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-4xl font-bold text-red-400 mb-2">-25%</p>
              <p className="text-sm text-zinc-500">traffic drop if you&apos;re not in AI results</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              SEO + AIO. One platform.
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Everything you need to rank in traditional search and get cited by AI platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Eye,
                title: "AI Visibility Score",
                description: "See how visible you are to ChatGPT, Perplexity, Google AI, and Bing Copilot.",
                highlight: true,
              },
              {
                icon: Brain,
                title: "Real Platform Tracking",
                description: "We query AI platforms directly. Real citations, not estimates.",
                highlight: true,
              },
              {
                icon: FileText,
                title: "AI-Optimized Content",
                description: "Generate articles with FAQ sections, definitions, and quotable snippets.",
              },
              {
                icon: Target,
                title: "Technical Audits",
                description: "Full SEO audits with schema, meta tags, broken links, and more.",
              },
              {
                icon: BarChart3,
                title: "Keyword Tracking",
                description: "Monitor rankings, discover opportunities, cluster by topic.",
              },
              {
                icon: Globe,
                title: "Auto-Publishing",
                description: "Publish to WordPress, Webflow, or Shopify with one click.",
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className={`p-6 rounded-xl border transition-all duration-200 hover:border-zinc-600 ${
                  feature.highlight 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                <div className={`inline-flex p-3 rounded-lg mb-4 ${
                  feature.highlight ? "bg-emerald-500/10" : "bg-zinc-800"
                }`}>
                  <feature.icon className={`w-5 h-5 ${
                    feature.highlight ? "text-emerald-400" : "text-zinc-400"
                  }`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 bg-zinc-900/50 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why teams choose CabbageSEO
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-4 px-4 text-zinc-500 font-medium"></th>
                  <th className="text-center py-4 px-4 text-zinc-500 font-medium">Ahrefs</th>
                  <th className="text-center py-4 px-4 text-zinc-500 font-medium">Semrush</th>
                  <th className="text-center py-4 px-4 text-emerald-400 font-semibold">CabbageSEO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {[
                  { feature: "SEO Audits", a: true, s: true, c: true },
                  { feature: "Keyword Research", a: true, s: true, c: true },
                  { feature: "Content Generation", a: false, s: false, c: true },
                  { feature: "AI Visibility Score", a: false, s: false, c: true },
                  { feature: "AI Platform Tracking", a: false, s: false, c: true },
                  { feature: "Citation Monitoring", a: false, s: false, c: true },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4 text-zinc-300">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.a ? <Check className="w-4 h-4 text-zinc-500 mx-auto" /> : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.s ? <Check className="w-4 h-4 text-zinc-500 mx-auto" /> : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to track your AI visibility?
          </h2>
          <p className="text-zinc-400 mb-8">
            Analyze any URL for free. See your SEO and AI scores instantly.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white h-14 px-8 rounded-xl">
              Try the free analyzer
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src="/cabbageseo_logo.png" 
              alt="CabbageSEO" 
              className="h-8 w-auto"
            />
            <span className="text-sm font-medium text-zinc-400">CabbageSEO</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm text-zinc-600">© 2025 CabbageSEO</p>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      <ExitIntentPopup />
    </div>
  );
}