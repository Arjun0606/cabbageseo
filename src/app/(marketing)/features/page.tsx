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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeaturesPage() {
  const featureCategories = [
    {
      id: "geo",
      name: "GEO Analysis",
      icon: Brain,
      description: "Understand how AI sees your content",
      features: [
        {
          title: "GEO Score",
          description: "A single score (0-100) that tells you how likely AI platforms are to cite your content. Updated in real-time as you make changes.",
          details: [
            "Weighted average across all AI platforms",
            "Breakdown by platform (ChatGPT, Perplexity, Google AI)",
            "Historical tracking with trend indicators",
            "Comparison against industry benchmarks",
          ],
          icon: BarChart3,
        },
        {
          title: "Platform-Specific Analysis",
          description: "Each AI platform has different preferences. We analyze your content for each one separately.",
          details: [
            "ChatGPT optimization (conversation-friendly content)",
            "Perplexity optimization (citation-heavy, factual)",
            "Google AI Overview optimization (featured snippet format)",
            "Bing Copilot compatibility checks",
          ],
          icon: Layers,
        },
        {
          title: "Content Structure Analysis",
          description: "AI prefers content in specific formats. We check if your content matches what AI looks for.",
          details: [
            "FAQ section detection and scoring",
            "Definition patterns (\"X is...\" format)",
            "Key takeaways and summaries",
            "Step-by-step instruction format",
            "Comparison tables and data",
          ],
          icon: FileText,
        },
        {
          title: "Entity Density Scoring",
          description: "AI understands content through named entities. We measure how many relevant entities your content contains.",
          details: [
            "Named entity extraction",
            "Topic relevance scoring",
            "Keyword presence in key positions",
            "Semantic richness analysis",
          ],
          icon: Target,
        },
        {
          title: "Quotability Analysis",
          description: "AI cites content it can easily quote. We analyze how quotable your content is.",
          details: [
            "Short, factual statement detection",
            "Quotation-ready sentence structure",
            "Statistic and data presence",
            "Expert attribution detection",
          ],
          icon: MessageSquare,
        },
        {
          title: "Authority Signals",
          description: "AI prioritizes authoritative sources. We check if your content signals expertise.",
          details: [
            "Author information presence",
            "Expert credentials detection",
            "Source citation analysis",
            "Last updated date checking",
            "Schema markup verification",
          ],
          icon: Shield,
        },
      ],
    },
    {
      id: "seo",
      name: "SEO Analysis",
      icon: Search,
      description: "Traditional SEO still matters",
      features: [
        {
          title: "Technical SEO Audit",
          description: "Complete technical analysis of your website's SEO health.",
          details: [
            "Meta title and description optimization",
            "Heading hierarchy (H1, H2, H3) structure",
            "Canonical URL detection",
            "Robots.txt and sitemap analysis",
            "Page speed indicators",
          ],
          icon: Code,
        },
        {
          title: "On-Page SEO",
          description: "Content-level optimization checks for every page.",
          details: [
            "Keyword presence in key positions",
            "Content length analysis",
            "Internal linking structure",
            "Image alt text coverage",
            "Readability scoring",
          ],
          icon: FileText,
        },
        {
          title: "Schema Markup Detection",
          description: "Structured data helps both Google and AI understand your content.",
          details: [
            "JSON-LD schema detection",
            "Schema type identification",
            "FAQPage schema validation",
            "Article/BlogPosting schema",
            "Organization schema",
          ],
          icon: Database,
        },
        {
          title: "Mobile Optimization",
          description: "Mobile-first indexing checks for responsive design.",
          details: [
            "Viewport configuration",
            "Mobile-friendly tap targets",
            "Font size legibility",
            "Content width validation",
          ],
          icon: Smartphone,
        },
        {
          title: "Core Web Vitals",
          description: "Performance metrics that affect rankings and user experience.",
          details: [
            "Largest Contentful Paint (LCP)",
            "First Input Delay (FID) estimation",
            "Cumulative Layout Shift (CLS)",
            "Time to First Byte (TTFB)",
          ],
          icon: Zap,
        },
      ],
    },
    {
      id: "content",
      name: "Content Generation",
      icon: PenTool,
      description: "AI-powered content that gets cited",
      features: [
        {
          title: "GEO-Optimized Articles",
          description: "Generate full articles specifically structured to get cited by AI platforms.",
          details: [
            "AI-friendly structure (FAQs, definitions, summaries)",
            "Keyword-integrated content",
            "Quotable sentences and key takeaways",
            "Expert attribution formatting",
            "1,500-3,000 word articles",
          ],
          icon: FileText,
        },
        {
          title: "DALL-E Featured Images",
          description: "Auto-generate unique featured images for every article.",
          details: [
            "AI-generated relevant imagery",
            "Automatic alt text generation",
            "Multiple aspect ratios",
            "Brand style consistency",
          ],
          icon: ImageIcon,
        },
        {
          title: "Meta Tag Generation",
          description: "SEO-optimized titles and descriptions for every piece of content.",
          details: [
            "60-character optimized titles",
            "155-character meta descriptions",
            "Primary keyword integration",
            "Click-through rate optimization",
          ],
          icon: Code,
        },
        {
          title: "Schema Auto-Generation",
          description: "Automatically generate JSON-LD schema for your content.",
          details: [
            "Article/BlogPosting schema",
            "FAQPage schema for FAQ sections",
            "HowTo schema for tutorials",
            "Organization schema",
          ],
          icon: Database,
        },
        {
          title: "Content Brief Generator",
          description: "Get detailed content briefs for your writers or AI tools.",
          details: [
            "Target keyword analysis",
            "Competitor content gaps",
            "Suggested headings and structure",
            "Required entities and topics",
          ],
          icon: Layers,
        },
      ],
    },
    {
      id: "keywords",
      name: "Keyword Research",
      icon: Target,
      description: "Find keywords AI talks about",
      features: [
        {
          title: "AI-Powered Keyword Discovery",
          description: "Find keywords that AI platforms actually discuss and recommend.",
          details: [
            "GPT-powered keyword suggestions",
            "Topic clustering by semantic relevance",
            "Question-based keyword extraction",
            "Long-tail keyword generation",
          ],
          icon: Search,
        },
        {
          title: "Keyword Difficulty Scoring",
          description: "Understand how hard it is to rank for each keyword.",
          details: [
            "Competitive analysis scoring",
            "Domain authority requirements",
            "Content depth requirements",
            "Opportunity scoring",
          ],
          icon: BarChart3,
        },
        {
          title: "Search Intent Classification",
          description: "Categorize keywords by what users are actually looking for.",
          details: [
            "Informational intent detection",
            "Commercial intent detection",
            "Navigational queries",
            "Transactional keywords",
          ],
          icon: Brain,
        },
        {
          title: "One-Click Content Generation",
          description: "Generate a full GEO-optimized article from any keyword.",
          details: [
            "Instant article generation",
            "Keyword-focused structure",
            "Competitive positioning",
            "Internal linking suggestions",
          ],
          icon: Wand2,
        },
      ],
    },
    {
      id: "citations",
      name: "Citation Tracking",
      icon: Sparkles,
      description: "See when AI cites you",
      features: [
        {
          title: "Real Perplexity Citations",
          description: "Track when Perplexity AI cites your content in its responses.",
          details: [
            "API-based citation detection",
            "Query discovery",
            "Citation snippet extraction",
            "Source URL verification",
          ],
          icon: Eye,
        },
        {
          title: "Google AI Overview Tracking",
          description: "Monitor when Google AI Overviews reference your pages.",
          details: [
            "Gemini API with search grounding",
            "Real citation verification",
            "Featured snippet tracking",
            "AI Overview appearance monitoring",
          ],
          icon: Globe,
        },
        {
          title: "ChatGPT Mention Detection",
          description: "AI-powered detection of when ChatGPT recommends your content.",
          details: [
            "Simulated search queries",
            "Domain mention tracking",
            "Topic relevance scoring",
            "Competitive mention analysis",
          ],
          icon: Bot,
        },
        {
          title: "Email Alerts",
          description: "Get notified instantly when AI platforms cite your content.",
          details: [
            "New citation alerts",
            "Weekly summary reports",
            "Platform-specific notifications",
            "Team notification routing",
          ],
          icon: Bell,
        },
        {
          title: "Citation Reports",
          description: "Detailed reports on your AI visibility over time.",
          details: [
            "Citation trend analysis",
            "Platform breakdown",
            "Query categorization",
            "ROI tracking",
          ],
          icon: LineChart,
        },
      ],
    },
    {
      id: "autopilot",
      name: "Autopilot Mode",
      icon: RefreshCw,
      description: "Hands-off content generation",
      features: [
        {
          title: "Weekly Content Generation",
          description: "Automatically generate GEO-optimized articles on a schedule.",
          details: [
            "1-4 articles per week",
            "Topic suggestions based on your niche",
            "Trend-aware content ideas",
            "Seasonal content planning",
          ],
          icon: Clock,
        },
        {
          title: "Auto-Publishing",
          description: "Publish content directly to your CMS without manual intervention.",
          details: [
            "WordPress auto-publish",
            "Webflow auto-publish",
            "Draft or live publishing",
            "Scheduled publishing",
          ],
          icon: Zap,
        },
        {
          title: "Content Queue",
          description: "Review and approve content before publishing.",
          details: [
            "Draft review queue",
            "Edit before publish",
            "Bulk approval",
            "Content calendar view",
          ],
          icon: Layers,
        },
        {
          title: "Topic Suggestions",
          description: "AI-powered topic ideas based on your niche and competitors.",
          details: [
            "Gap analysis vs competitors",
            "Trending topic detection",
            "Seasonal opportunities",
            "Keyword-driven suggestions",
          ],
          icon: Wand2,
        },
      ],
    },
    {
      id: "integrations",
      name: "CMS Integrations",
      icon: Plug,
      description: "Connect your publishing platforms",
      features: [
        {
          title: "WordPress",
          description: "Full integration with WordPress sites via REST API.",
          details: [
            "Direct post publishing",
            "Featured image upload",
            "Category and tag mapping",
            "Custom field support",
          ],
          icon: Globe,
        },
        {
          title: "Webflow",
          description: "Publish to Webflow CMS collections.",
          details: [
            "CMS item creation",
            "Image upload support",
            "Rich text formatting",
            "Collection field mapping",
          ],
          icon: Palette,
        },
        {
          title: "Shopify",
          description: "Create blog posts on your Shopify store.",
          details: [
            "Blog post publishing",
            "Image handling",
            "SEO field population",
            "Product linking",
          ],
          icon: Building,
        },
        {
          title: "Ghost",
          description: "Publish to Ghost blogs via Admin API.",
          details: [
            "Post creation",
            "Featured image support",
            "Tag management",
            "Member-only content",
          ],
          icon: FileText,
        },
        {
          title: "Notion",
          description: "Create pages in your Notion workspace.",
          details: [
            "Page creation",
            "Database integration",
            "Rich content blocks",
            "Property mapping",
          ],
          icon: Layers,
        },
        {
          title: "HubSpot",
          description: "Publish blog posts to HubSpot.",
          details: [
            "Blog post creation",
            "Author assignment",
            "Topic clustering",
            "CTA integration",
          ],
          icon: Building,
        },
        {
          title: "Framer",
          description: "Create CMS entries in Framer.",
          details: [
            "CMS collection publishing",
            "Image optimization",
            "Content formatting",
            "Slug generation",
          ],
          icon: Palette,
        },
        {
          title: "Webhooks",
          description: "Send content to any platform via webhooks.",
          details: [
            "Custom webhook URLs",
            "JSON payload format",
            "Authentication headers",
            "Retry handling",
          ],
          icon: Link2,
        },
      ],
    },
    {
      id: "exports",
      name: "Export & Reports",
      icon: Download,
      description: "Share with your team",
      features: [
        {
          title: "Copy for AI Assistants",
          description: "One-click copy reports formatted for Cursor, Claude, or ChatGPT.",
          details: [
            "Markdown formatted reports",
            "Code examples included",
            "Implementation instructions",
            "Prompt suggestions",
          ],
          icon: Code,
        },
        {
          title: "Download as Markdown",
          description: "Download full reports as .md files for developers.",
          details: [
            "Engineer-friendly format",
            "Implementation checklist",
            "Code snippets included",
            "Priority-ranked fixes",
          ],
          icon: Download,
        },
        {
          title: "PDF Reports",
          description: "Professional PDF reports for clients and stakeholders.",
          details: [
            "Branded reports",
            "Executive summary",
            "Visual score charts",
            "Detailed recommendations",
          ],
          icon: FileText,
        },
        {
          title: "API Access",
          description: "Integrate CabbageSEO data into your own tools.",
          details: [
            "RESTful API",
            "Webhook notifications",
            "Bulk operations",
            "Rate-limited access",
          ],
          icon: Database,
        },
      ],
    },
  ];

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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 border-b border-zinc-800">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            50+ Features for GEO
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Every Feature You Need to<br />
            <span className="text-emerald-400">Get Cited by AI</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            A complete platform for Generative Engine Optimization. Analyze, optimize, 
            generate, publish, and track — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Search className="w-5 h-5 mr-2" />
                Try Free Analysis
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                View Pricing
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="geo" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent mb-12">
              {featureCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="px-4 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-zinc-400 hover:text-white transition-colors"
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {featureCategories.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 text-zinc-300 mb-4">
                    <category.icon className="w-5 h-5" />
                    {category.name}
                  </div>
                  <p className="text-zinc-400">{category.description}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.features.map((feature, index) => (
                    <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                      <CardHeader>
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                          <feature.icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <CardTitle className="text-white">{feature.title}</CardTitle>
                        <CardDescription className="text-zinc-400">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 bg-zinc-900/50 border-y border-zinc-800">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50+", label: "Features" },
              { number: "8", label: "CMS Integrations" },
              { number: "4", label: "AI Platforms Tracked" },
              { number: "100+", label: "GEO Checks" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white">{stat.number}</p>
                <p className="text-sm text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Explore?</h2>
          <p className="text-zinc-400 mb-8">
            Start with a free analysis to see CabbageSEO in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2026 CabbageSEO. The AI-Native SEO OS.</p>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

