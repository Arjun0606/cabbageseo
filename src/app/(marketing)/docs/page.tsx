"use client";

import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Sparkles,
  Search,
  FileText,
  Gauge,
  Brain,
  Settings,
  CheckCircle2,
  Play,
  ChevronRight,
  BookOpen,
  Zap,
  Target,
  BarChart3,
  Link2,
  ExternalLink,
  Code,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ============================================
// QUICK START STEPS
// ============================================

const quickStartSteps = [
  {
    step: 1,
    title: "Add Your Website",
    description: "Enter your website URL and we'll automatically crawl and analyze it",
    details: [
      "Go to Dashboard → Click 'Add Website' or use the command palette (⌘K)",
      "Enter your full URL (e.g., https://yoursite.com)",
      "We'll crawl your site, analyze SEO, and calculate your GEO score",
      "This takes 30-60 seconds depending on site size",
    ],
    icon: Globe,
  },
  {
    step: 2,
    title: "Review Your GEO Score",
    description: "See how visible your site is across AI platforms",
    details: [
      "View your overall GEO (Generative Engine Optimization) score",
      "See scores for ChatGPT, Perplexity, and Google AI Overviews",
      "Understand which AI platforms already cite your content",
      "Get specific recommendations to improve visibility",
    ],
    icon: Brain,
  },
  {
    step: 3,
    title: "Generate AI-Optimized Content",
    description: "Create articles designed to be cited by AI platforms",
    details: [
      "Click 'Generate Article' in the sidebar",
      "Choose a keyword or topic relevant to your site",
      "Select optimization mode (GEO-focused, SEO-focused, or Balanced)",
      "Each article includes AI-generated featured images automatically",
    ],
    icon: Sparkles,
  },
  {
    step: 4,
    title: "Publish to Your CMS",
    description: "One-click publishing to WordPress, Webflow, or Shopify",
    details: [
      "Go to Settings → Integrations → Connect your CMS",
      "Enter your CMS credentials (API key or admin URL)",
      "Test the connection to ensure it works",
      "Publish articles directly from the Content page",
    ],
    icon: ExternalLink,
  },
];

// ============================================
// FEATURE GUIDES
// ============================================

const featureGuides = [
  {
    id: "geo-score",
    title: "GEO Score & AI Visibility",
    description: "Track how AI platforms cite your content",
    icon: Brain,
    badge: "Core Feature",
    steps: [
      {
        title: "Understanding Your GEO Score",
        content: "Your GEO score (0-100) measures how likely AI platforms are to cite your content. Higher scores mean better visibility in ChatGPT, Perplexity, and Google AI Overviews.",
      },
      {
        title: "What Affects Your Score",
        content: "Structured content (FAQs, headings, lists), clear definitions, authoritative sources, recent updates, and schema markup all boost your score.",
      },
      {
        title: "Improving Your Score",
        content: "Generate GEO-optimized content, add FAQ sections, use clear definitions ('X is...'), include statistics with sources, and update content regularly.",
      },
    ],
  },
  {
    id: "content-generation",
    title: "AI Content Generation",
    description: "Create citation-worthy articles automatically",
    icon: Sparkles,
    steps: [
      {
        title: "Starting a New Article",
        content: "Click 'Generate Article' in the sidebar. Enter a target keyword and optionally customize the title. The AI will create a comprehensive, SEO/GEO-optimized article.",
      },
      {
        title: "Optimization Modes",
        content: "Choose 'GEO' for AI citation optimization, 'SEO' for traditional search rankings, or 'Balanced' for both. GEO mode includes more FAQs, definitions, and quotable sections.",
      },
      {
        title: "Editing & Publishing",
        content: "Review and edit the generated content. Adjust meta titles, descriptions, and body text. Then publish directly to your CMS or download as markdown.",
      },
      {
        title: "Featured Images",
        content: "Each article automatically generates an AI-powered featured image. The image is optimized for your topic and saved with your content.",
      },
    ],
  },
  {
    id: "keywords",
    title: "Keyword Research",
    description: "Find high-value keywords for your site",
    icon: Search,
    steps: [
      {
        title: "Researching Keywords",
        content: "Go to Keywords → Click 'Research Keywords'. Enter a seed keyword related to your business. We'll find related keywords with search volume, difficulty, and CPC data.",
      },
      {
        title: "Understanding Metrics",
        content: "Volume = monthly searches. Difficulty = how hard to rank (0-100). CPC = cost per click for ads. Intent = informational, commercial, transactional, or navigational.",
      },
      {
        title: "Keyword Clusters",
        content: "We automatically group related keywords into clusters. Each cluster can be targeted with a single piece of content covering the topic comprehensively.",
      },
      {
        title: "Generating Content from Keywords",
        content: "Click any keyword's menu → 'Generate Content'. This creates an article optimized for that keyword and its cluster.",
      },
    ],
  },
  {
    id: "audit",
    title: "Technical SEO Audit",
    description: "Find and fix technical issues",
    icon: Gauge,
    steps: [
      {
        title: "Running an Audit",
        content: "Go to SEO Audit. Click 'Run Audit' to scan your site for technical issues. We check meta tags, headings, images, links, page speed, mobile-friendliness, and more.",
      },
      {
        title: "Understanding Results",
        content: "Issues are categorized as Critical (fix immediately), Warning (should fix), or Info (nice to have). Each issue includes a description and fix recommendation.",
      },
      {
        title: "Exporting for Developers",
        content: "Click 'Export Report' to download a markdown file. This can be pasted directly into any AI coding assistant to help implement fixes.",
      },
    ],
  },
  {
    id: "integrations",
    title: "CMS Integrations",
    description: "Connect your publishing platforms",
    icon: Link2,
    steps: [
      {
        title: "WordPress Setup",
        content: "Go to Settings → Integrations → WordPress. Enter your site URL and either an Application Password or REST API credentials. Test the connection before saving.",
      },
      {
        title: "Webflow Setup",
        content: "Get your Webflow API token from Project Settings → Integrations. Enter the token and your site/collection IDs. We'll publish to your CMS collection.",
      },
      {
        title: "Shopify Setup",
        content: "Create a private app in Shopify admin with blog access. Enter the store URL and API credentials. Articles are published to your blog.",
      },
      {
        title: "Other Integrations",
        content: "We also support Ghost, Notion, HubSpot, Framer, and custom webhooks. Each has similar setup - add credentials and test the connection.",
      },
    ],
  },
];

// ============================================
// FAQ
// ============================================

const faqs = [
  {
    question: "What is GEO (Generative Engine Optimization)?",
    answer: "GEO is the practice of optimizing your content to be cited by AI platforms like ChatGPT, Perplexity, and Google AI Overviews. Unlike traditional SEO which focuses on ranking in search results, GEO focuses on making your content the source that AI references when answering questions.",
  },
  {
    question: "How does the URL-to-everything flow work?",
    answer: "You enter your website URL once during onboarding. We automatically: 1) Crawl your pages, 2) Analyze SEO issues, 3) Calculate your GEO score, 4) Find content opportunities. All features (keywords, content, audits) are then tied to your site automatically. Switch between sites using the dropdown in the header.",
  },
  {
    question: "How are articles connected to my website?",
    answer: "When you generate content, it's automatically associated with your selected website. This means: 1) Keywords are researched based on your site's context, 2) Content is optimized for your industry and audience, 3) Publishing goes to your connected CMS. Switch sites in the header to work on different projects.",
  },
  {
    question: "What AI models do you use?",
    answer: "We use state-of-the-art AI models for content generation, analysis, and image creation. Our models are continuously updated to provide the best results and stay ahead of the latest advancements.",
  },
  {
    question: "How do I get my content cited by AI?",
    answer: "Our GEO-optimized content is specifically structured for AI citation: clear definitions, FAQ sections, quotable paragraphs (50-150 words), statistics with sources, and proper schema markup. The more authoritative and well-structured your content, the more likely AI will cite it.",
  },
  {
    question: "Can I edit generated content?",
    answer: "Absolutely! All generated content can be fully edited before publishing. Click on any article to open the editor where you can modify the title, meta description, body content, and more. You maintain full control.",
  },
  {
    question: "What happens if I reach my plan limits?",
    answer: "You'll see a notification when approaching limits. Once reached, you can upgrade your plan for more capacity or wait until the next billing cycle when limits reset. Usage is tracked per calendar month.",
  },
  {
    question: "How do I export reports for developers?",
    answer: "On the SEO Audit page, click 'Export Report' to download a markdown file containing all issues and fix recommendations. This file is formatted to be pasted directly into AI coding assistants for implementation help.",
  },
  {
    question: "Do you support multiple languages?",
    answer: "Yes! Content generation works in most major languages including Spanish, French, German, Portuguese, Italian, Dutch, and more. Specify the target language in your content settings.",
  },
  {
    question: "What's the difference between each plan?",
    answer: "Starter ($29/mo): 50 articles, 500 keywords, 3 sites. Pro ($79/mo): 150 articles, 2000 keywords, 10 sites, autopilot mode. Agency ($199/mo): 500 articles, 10000 keywords, 50 sites, API access, white-label. All plans include AI-generated images.",
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-8" />
              <span className="font-bold text-lg">
                Cabbage<span className="text-emerald-400">SEO</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing" className="text-zinc-400 hover:text-white text-sm">
                Pricing
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                  Dashboard
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <BookOpen className="w-3 h-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How to Use CabbageSEO
            </h1>
            <p className="text-xl text-zinc-400">
              Complete guide to dominating AI search with GEO-optimized content
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Quick Start Guide</h2>
              <p className="text-zinc-400">Get your first GEO-optimized article live in 5 minutes</p>
            </div>

            <div className="space-y-6">
              {quickStartSteps.map((item, index) => (
                <Card key={index} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                            Step {item.step}
                          </Badge>
                          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        </div>
                        <p className="text-zinc-400 mb-4">{item.description}</p>
                        <ul className="space-y-2">
                          {item.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                  <Play className="w-4 h-4 mr-2" />
                  Start Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Guides */}
      <section className="py-16 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Feature Guides</h2>
              <p className="text-zinc-400">Deep dives into each CabbageSEO feature</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {featureGuides.map((guide) => (
                <AccordionItem
                  key={guide.id}
                  value={guide.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-6"
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <guide.icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{guide.title}</h3>
                          {guide.badge && (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                              {guide.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{guide.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-4 pl-14">
                      {guide.steps.map((step, i) => (
                        <div key={i} className="border-l-2 border-emerald-500/30 pl-4">
                          <h4 className="font-medium text-white mb-1">{step.title}</h4>
                          <p className="text-sm text-zinc-400">{step.content}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* The Complete Workflow */}
      <section className="py-16 border-b border-zinc-800 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">The Complete Workflow</h2>
              <p className="text-zinc-400">How everything connects together</p>
            </div>

            <div className="relative">
              {/* Flow diagram */}
              <div className="grid md:grid-cols-5 gap-4">
                {[
                  { icon: Globe, label: "Enter URL", desc: "One-time setup" },
                  { icon: Brain, label: "Get GEO Score", desc: "AI visibility" },
                  { icon: Search, label: "Keywords", desc: "Find opportunities" },
                  { icon: Sparkles, label: "Generate", desc: "AI content" },
                  { icon: ExternalLink, label: "Publish", desc: "To your CMS" },
                ].map((step, i) => (
                  <div key={i} className="relative">
                    <Card className="bg-zinc-800/50 border-zinc-700 text-center">
                      <CardContent className="p-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                          <step.icon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="font-semibold text-white text-sm">{step.label}</h4>
                        <p className="text-xs text-zinc-400 mt-1">{step.desc}</p>
                      </CardContent>
                    </Card>
                    {i < 4 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Key Points
                </h4>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">One URL, everything connected:</strong> Enter your website once. All content, keywords, and audits are automatically linked to that site.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">Site switcher in header:</strong> Working on multiple sites? Use the dropdown in the top-right to switch between projects. Each site has its own data.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">Context-aware generation:</strong> Keywords and content are generated based on your site's industry, existing pages, and business context.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white">CMS per-site:</strong> Connect different CMS platforms to different sites. Content publishes to the correct destination automatically.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-zinc-400">Everything you need to know</p>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left text-white hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Developer Export Section */}
      <section className="py-16 border-b border-zinc-800 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Code className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Export for Developers</h2>
            <p className="text-zinc-400 mb-8">
              Every SEO audit can be exported as a structured markdown report. Paste it directly into 
              any AI coding assistant to get implementation help for fixing issues in your codebase.
            </p>
            <div className="bg-zinc-800/50 rounded-xl p-6 text-left border border-zinc-700">
              <p className="text-sm text-zinc-400 font-mono mb-2"># Example Export</p>
              <pre className="text-sm text-zinc-300 font-mono overflow-x-auto">
{`## SEO Audit Report - yoursite.com

### Critical Issues (Fix Immediately)

1. **Missing H1 tag on homepage**
   - Location: /index.html
   - Fix: Add a single H1 with your main keyword
   
2. **Images without alt text** (15 found)
   - Add descriptive alt attributes to all images
   
### Implementation Guide
[Detailed steps for each fix...]`}
              </pre>
            </div>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  <Download className="w-4 h-4 mr-2" />
                  Try Export Feature
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Dominate AI Search?
            </h2>
            <p className="text-zinc-400 mb-8">
              Get your GEO score and start generating AI-optimized content today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analyze">
                <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
                  Free URL Analyzer
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/cabbageseo_logo.png" alt="CabbageSEO" className="h-6" />
              <span className="text-sm text-zinc-400">© 2026 CabbageSEO - The Ultimate GEO Machine</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/pricing" className="hover:text-white">Pricing</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/feedback" className="hover:text-emerald-400 text-emerald-400/70">Feedback</Link>
              <a href="https://x.com/ArzBusiness" target="_blank" rel="noopener noreferrer" className="hover:text-white">𝕏 @ArzBusiness</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

