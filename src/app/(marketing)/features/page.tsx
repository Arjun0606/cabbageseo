"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Target,
  Sparkles,
  Zap,
  Globe,
  TrendingUp,
  FileText,
  BarChart3,
  RefreshCw,
  Settings,
  Mail,
  Search,
  Clock,
  CheckCircle2,
  Code,
  Layers,
  Shield,
  Eye,
  Palette,
  Link2,
  Image as ImageIcon,
  MessageSquare,
  Download,
  Bell,
  Plug,
  Database,
  GitBranch,
  Wand2,
  PenTool,
  LineChart,
  Users,
  Building,
  Smartphone,
  Quote,
  BookOpen,
  Lightbulb,
  Trophy,
  Gauge,
  MapPin,
  Calendar,
  Send,
  Play,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============================================
// COMPREHENSIVE FEATURES PAGE
// Explains every feature and how it helps get cited by AI
// ============================================

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="CabbageSEO" className="w-8 h-8" />
            <span className="font-bold text-xl">CabbageSEO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground">Docs</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
            50+ Features for AI Visibility
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Every Feature Designed to Get You{" "}
            <span className="text-emerald-500">Cited by AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            CabbageSEO is the complete GEO (Generative Engine Optimization) platform. 
            We analyze, optimize, generate, and track your content for AI search engines 
            like ChatGPT, Perplexity, and Google AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Try Free Analysis
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Start Getting Cited
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Platforms We Optimize For */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">AI Platforms We Optimize For</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each AI platform has different preferences. We analyze and optimize your content 
              for all major AI search engines.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <div className="text-4xl mb-2">🤖</div>
                <CardTitle>ChatGPT / SearchGPT</CardTitle>
                <CardDescription>OpenAI&apos;s AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ChatGPT prefers content that is conversational, well-structured, and has 
                  clear expert attribution. We optimize for:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Quotable, authoritative statements
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    FAQ sections with clear Q&A format
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Expert credentials and author info
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Definition patterns (&quot;X is...&quot;)
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>How we check:</strong> We use OpenAI&apos;s API to simulate 
                    search queries and check if your domain is mentioned in responses.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <div className="text-4xl mb-2">🔮</div>
                <CardTitle>Perplexity AI</CardTitle>
                <CardDescription>The AI-powered search engine</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Perplexity actively cites sources and prefers factual, well-researched 
                  content with data. We optimize for:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Statistics and data points
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Recent/updated content dates
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Cited sources and references
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Topic-specific named entities
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-emerald-500">
                    <strong>✓ REAL Citation Checking:</strong> We query Perplexity&apos;s API 
                    directly to see if they&apos;re citing your content.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <div className="text-4xl mb-2">✨</div>
                <CardTitle>Google AI Overview</CardTitle>
                <CardDescription>Google&apos;s AI-generated answers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Google AI Overview (formerly SGE) pulls from top-ranking content with 
                  structured data. We optimize for:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Schema.org structured data
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Featured snippet format
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Clear, direct answers
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    E-E-A-T signals (expertise, experience)
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-xs text-emerald-500">
                    <strong>✓ REAL Citation Checking:</strong> We use Google Gemini API 
                    with search grounding to verify citations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to dominate AI search results
            </p>
          </div>

          {/* Feature Category: GEO Analysis */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Brain className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">GEO Analysis</h3>
                <p className="text-muted-foreground">Understand how AI sees your content</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Gauge}
                title="GEO Score (0-100)"
                description="A single score that tells you how likely AI platforms are to cite your content. Tracks improvements over time."
                howItHelps="Higher scores = more AI citations. We break down exactly what's working and what needs improvement."
              />
              <FeatureCard
                icon={Layers}
                title="Platform-Specific Scores"
                description="Separate scores for ChatGPT, Perplexity, and Google AI. Each has different preferences."
                howItHelps="Know exactly which platform you're strong/weak on, so you can prioritize improvements."
              />
              <FeatureCard
                icon={Quote}
                title="Quotability Analysis"
                description="AI cites content it can easily quote. We identify your most quotable sentences."
                howItHelps="We show you which sentences AI is likely to cite verbatim, so you can optimize them."
              />
              <FeatureCard
                icon={Target}
                title="Entity Density Scoring"
                description="AI understands content through named entities. We measure your entity coverage."
                howItHelps="More relevant entities = higher topical authority = more citations."
              />
              <FeatureCard
                icon={BookOpen}
                title="Answer Structure Check"
                description="AI prefers content in specific formats: FAQs, definitions, lists, how-tos."
                howItHelps="We check if you have the structures AI looks for and tell you what's missing."
              />
              <FeatureCard
                icon={Shield}
                title="Authority Signals"
                description="Expert attribution, author credentials, sources cited, last updated dates."
                howItHelps="AI prioritizes authoritative sources. We check all the trust signals."
              />
            </div>
          </div>

          {/* Feature Category: Citation Tracking */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Citation Tracking</h3>
                <p className="text-muted-foreground">Know when AI mentions you</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={CheckCheck}
                title="Real Citation Checks"
                description="We query Perplexity and Google AI directly to find actual citations of your content."
                howItHelps="Not estimates - real proof that AI is citing you. Show clients and stakeholders."
                badge="Real API"
                badgeColor="emerald"
              />
              <FeatureCard
                icon={Bell}
                title="Email Alerts"
                description="Get notified instantly when AI platforms start citing your content."
                howItHelps="Know the moment you get cited. Celebrate wins and track what's working."
              />
              <FeatureCard
                icon={TrendingUp}
                title="Citation History"
                description="Track citations over time. See which pages get cited most."
                howItHelps="Identify patterns - what content style gets cited? Double down on what works."
              />
              <FeatureCard
                icon={BarChart3}
                title="Platform Breakdown"
                description="See citations by platform: ChatGPT, Perplexity, Google AI."
                howItHelps="Know which AI platforms love your content and which need more work."
              />
              <FeatureCard
                icon={Search}
                title="Query Discovery"
                description="See the actual queries where AI cites you."
                howItHelps="Discover what questions your content answers well. Create more content like it."
              />
              <FeatureCard
                icon={Download}
                title="Proof Reports"
                description="Export citation reports to show clients, bosses, or stakeholders."
                howItHelps="ROI proof: 'AI cited us X times this month on these topics.'"
              />
            </div>
          </div>

          {/* Feature Category: Content Generation */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <PenTool className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AI Content Generation</h3>
                <p className="text-muted-foreground">Content built to get cited</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={FileText}
                title="GEO-Optimized Articles"
                description="Full 1,500-3,000 word articles with FAQs, definitions, quotable statements."
                howItHelps="Every article is structured for AI citation from day one."
              />
              <FeatureCard
                icon={ImageIcon}
                title="DALL-E Images"
                description="AI-generated featured images for every article, with auto alt text."
                howItHelps="Unique images that match your content. No stock photos needed."
              />
              <FeatureCard
                icon={Code}
                title="Schema Auto-Generation"
                description="JSON-LD schema markup: Article, FAQ, HowTo, Organization."
                howItHelps="Structured data helps Google AI understand and cite your content."
              />
              <FeatureCard
                icon={Wand2}
                title="Meta Tag Generation"
                description="SEO-optimized titles (60 chars) and descriptions (155 chars)."
                howItHelps="Click-worthy meta tags that also signal relevance to AI."
              />
              <FeatureCard
                icon={Layers}
                title="Outline Generator"
                description="Generate detailed content outlines before writing."
                howItHelps="Plan your content structure for maximum AI citation potential."
              />
              <FeatureCard
                icon={MessageSquare}
                title="FAQ Generation"
                description="Auto-generate relevant FAQs for any topic."
                howItHelps="FAQs are citation gold - AI loves clear Q&A format."
              />
            </div>
          </div>

          {/* Feature Category: Keyword Research */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AI-Powered Keyword Research</h3>
                <p className="text-muted-foreground">Find keywords AI talks about</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Lightbulb}
                title="GEO Keyword Discovery"
                description="Find keywords with high AI citation potential, not just search volume."
                howItHelps="Target keywords AI actually discusses and recommends."
              />
              <FeatureCard
                icon={GitBranch}
                title="Topic Clustering"
                description="Group keywords by semantic relevance. Build topical authority."
                howItHelps="AI rewards sites that cover topics comprehensively."
              />
              <FeatureCard
                icon={MessageSquare}
                title="Question Extraction"
                description="Find the questions people (and AI) are asking about your topics."
                howItHelps="Answer questions = get cited when AI answers those questions."
              />
              <FeatureCard
                icon={BarChart3}
                title="Difficulty Scoring"
                description="Know how hard it is to rank and get cited for each keyword."
                howItHelps="Target low-difficulty, high-opportunity keywords first."
              />
              <FeatureCard
                icon={Brain}
                title="Intent Classification"
                description="Informational, commercial, transactional - we classify it all."
                howItHelps="Match content type to user intent for better AI relevance."
              />
              <FeatureCard
                icon={Zap}
                title="One-Click Content"
                description="Generate a full article from any keyword with one click."
                howItHelps="From keyword to published article in minutes."
              />
            </div>
          </div>

          {/* Feature Category: Autopilot */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-pink-500/10">
                <RefreshCw className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Autopilot Mode</h3>
                <p className="text-muted-foreground">Set it and forget it</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Calendar}
                title="Weekly Content Generation"
                description="Automatically generates and publishes new articles every week."
                howItHelps="Consistent publishing = consistent AI visibility growth."
                badge="Pro+"
                badgeColor="pink"
              />
              <FeatureCard
                icon={Play}
                title="One-Click Setup"
                description="Enter your URL, we analyze and start generating content."
                howItHelps="No complex setup. Just connect and go."
              />
              <FeatureCard
                icon={Settings}
                title="Custom Frequency"
                description="Choose weekly, bi-weekly, or monthly content cadence."
                howItHelps="Match your publishing capacity and budget."
              />
              <FeatureCard
                icon={Send}
                title="Auto-Publish to CMS"
                description="Content publishes directly to your CMS automatically."
                howItHelps="True hands-off operation. No copy-paste needed."
              />
              <FeatureCard
                icon={Eye}
                title="Citation Monitoring"
                description="Continuously checks if your content gets cited by AI."
                howItHelps="Track ROI automatically. Know what's working."
              />
              <FeatureCard
                icon={Bell}
                title="Progress Reports"
                description="Weekly email summaries of content published and citations found."
                howItHelps="Stay informed without logging in."
              />
            </div>
          </div>

          {/* Feature Category: CMS Publishing */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Plug className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">CMS Publishing</h3>
                <p className="text-muted-foreground">Publish anywhere</p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <CMSCard name="WordPress" icon="🔵" description="REST API integration" />
              <CMSCard name="Webflow" icon="🟣" description="CMS collection items" />
              <CMSCard name="Shopify" icon="🛒" description="Blog posts via API" />
              <CMSCard name="Ghost" icon="👻" description="Admin API integration" />
              <CMSCard name="Notion" icon="📝" description="Database pages" />
              <CMSCard name="HubSpot" icon="🧡" description="Blog posts via API" />
              <CMSCard name="Framer" icon="🎨" description="CMS integration" />
              <CMSCard name="Webhooks" icon="🔗" description="Any platform" />
            </div>
          </div>

          {/* Feature Category: Location-Aware */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <MapPin className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Location-Aware GEO</h3>
                <p className="text-muted-foreground">Local visibility in AI</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={MapPin}
                title="Location Detection"
                description="Analyze content for local relevance based on user's region."
                howItHelps="AI gives different answers by location. We optimize for yours."
              />
              <FeatureCard
                icon={Globe}
                title="Local Entity Extraction"
                description="Identify region-specific entities in your content."
                howItHelps="Local entities = local authority = local AI citations."
              />
              <FeatureCard
                icon={Target}
                title="Regional Recommendations"
                description="Get suggestions for improving local GEO visibility."
                howItHelps="Know exactly what local content to add."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-emerald-500/5 border-y border-emerald-500/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Cited by AI?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start with a free analysis of your website. See your GEO score and get 
            actionable recommendations to improve your AI visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" variant="outline">
                Free Analysis
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Get Started — $29/mo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/apple-touch-icon.png" alt="CabbageSEO" className="w-6 h-6" />
              <span className="font-bold">CabbageSEO</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/features">Features</Link>
              <Link href="/how-it-works">How It Works</Link>
              <Link href="/about">About</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/docs">Docs</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
            <div className="flex gap-4">
              <a href="https://x.com/Arjun06061" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                𝕏
              </a>
              <a href="mailto:arjun@cabbageseo.com" className="text-muted-foreground hover:text-foreground">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function FeatureCard({
  icon: Icon,
  title,
  description,
  howItHelps,
  badge,
  badgeColor = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  howItHelps: string;
  badge?: string;
  badgeColor?: string;
}) {
  const badgeStyles: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    pink: "bg-pink-500/10 text-pink-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return (
    <Card className="h-full hover:border-emerald-500/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Icon className="w-5 h-5 text-muted-foreground" />
          {badge && (
            <Badge className={badgeStyles[badgeColor] || badgeStyles.emerald} variant="outline">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs">
            <span className="text-emerald-500 font-medium">How it helps: </span>
            {howItHelps}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CMSCard({
  name,
  icon,
  description,
}: {
  name: string;
  icon: string;
  description: string;
}) {
  return (
    <Card className="text-center hover:border-emerald-500/30 transition-colors">
      <CardContent className="pt-6">
        <div className="text-3xl mb-2">{icon}</div>
        <h4 className="font-semibold">{name}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
