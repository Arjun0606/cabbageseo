"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sparkles,
  Target,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
  Link2,
  Hash,
  FileText,
  BarChart3,
  RefreshCw,
  Loader2,
  Copy,
  Wand2,
  ChevronRight,
  ExternalLink,
  Code,
  Image,
  List,
} from "lucide-react";
import Link from "next/link";

// Mock data - in production comes from API
const mockContent = {
  id: "1",
  title: "The Complete Guide to AI SEO Tools in 2024",
  targetKeyword: "ai seo tools",
  secondaryKeywords: ["best ai seo software", "ai powered seo", "automated seo tools"],
  metaTitle: "AI SEO Tools: The Complete Guide for 2024 | Boost Your Rankings",
  metaDescription: "Discover the best AI SEO tools in 2024. Learn how AI-powered software can automate keyword research, content optimization, and boost your search rankings.",
  content: `# The Complete Guide to AI SEO Tools in 2024

## Introduction

Artificial intelligence is revolutionizing the SEO industry. In this comprehensive guide, we'll explore the best AI SEO tools available in 2024 and how they can transform your search optimization strategy.

## What Are AI SEO Tools?

AI SEO tools use machine learning and natural language processing to automate and enhance various aspects of search engine optimization. These tools can:

- **Analyze competitors** automatically and identify opportunities
- **Generate optimized content** that ranks well in search results
- **Research keywords** and cluster them into topical groups
- **Optimize existing content** with data-driven suggestions

## Top AI SEO Tools for 2024

### 1. CabbageSEO

The ultimate AI-powered SEO platform that combines keyword research, content generation, and optimization into one seamless workflow.

### 2. Surfer SEO

Known for its content optimization features and NLP analysis.

### 3. Clearscope

Popular among enterprise teams for content grading and optimization.

## How to Choose the Right AI SEO Tool

When selecting an AI SEO tool, consider:

1. **Your budget** - Prices range from $30 to $500+ per month
2. **Your needs** - Content generation vs. technical SEO vs. research
3. **Integration capabilities** - CMS, analytics, other tools
4. **Ease of use** - Learning curve and user interface

## Conclusion

AI SEO tools are no longer optional—they're essential for staying competitive in search. Start with a tool that matches your immediate needs and scale from there.

## FAQ

### What is the best AI SEO tool?

CabbageSEO offers the most comprehensive AI-powered SEO solution, combining keyword research, content generation, and optimization in one platform.

### Are AI SEO tools worth it?

Yes, AI SEO tools can save hours of manual work and often produce better results than manual optimization alone.

### How much do AI SEO tools cost?

Prices typically range from $30/month for basic tools to $500+/month for enterprise solutions.`,
  wordCount: 320,
  readingTime: 2,
  status: "draft" as const,
  seoScore: 78,
  createdAt: "2024-12-01",
  updatedAt: "2024-12-08",
};

const mockSuggestions = {
  overall: 78,
  suggestions: [
    {
      type: "keyword" as const,
      priority: "high" as const,
      message: "Add target keyword to first paragraph",
      current: "Missing in intro",
      target: "Include 'ai seo tools' naturally",
    },
    {
      type: "structure" as const,
      priority: "medium" as const,
      message: "Add more H2 headings",
      current: "4 headings",
      target: "6-8 headings recommended",
    },
    {
      type: "content" as const,
      priority: "medium" as const,
      message: "Increase word count",
      current: "320 words",
      target: "2000+ words for comprehensive guide",
    },
    {
      type: "links" as const,
      priority: "low" as const,
      message: "Add internal links",
      current: "0 internal links",
      target: "3-5 internal links",
    },
  ],
  keywordUsage: [
    { keyword: "ai seo tools", count: 3, target: { min: 5, max: 10 }, status: "under" as const },
    { keyword: "best ai seo software", count: 1, target: { min: 2, max: 5 }, status: "under" as const },
    { keyword: "automated seo", count: 1, target: { min: 2, max: 4 }, status: "optimal" as const },
  ],
};

function getSuggestionIcon(type: string) {
  switch (type) {
    case "keyword": return <Target className="h-4 w-4" />;
    case "structure": return <List className="h-4 w-4" />;
    case "content": return <FileText className="h-4 w-4" />;
    case "links": return <Link2 className="h-4 w-4" />;
    case "image": return <Image className="h-4 w-4" />;
    default: return <Lightbulb className="h-4 w-4" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "text-red-600 bg-red-50 dark:bg-red-950";
    case "medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
    case "low": return "text-blue-600 bg-blue-50 dark:bg-blue-950";
    default: return "text-slate-600 bg-slate-50";
  }
}

function getKeywordStatusColor(status: string) {
  switch (status) {
    case "optimal": return "text-green-600";
    case "under": return "text-yellow-600";
    case "over": return "text-red-600";
    default: return "text-slate-600";
  }
}

export default function ContentEditorPage() {
  const router = useRouter();
  const [content, setContent] = useState(mockContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsPublishing(false);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 3000));
    setIsOptimizing(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/content">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-white truncate max-w-md">
                {content.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary">{content.status}</Badge>
                <span className="text-xs text-slate-500">
                  Last saved {new Date(content.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium">SEO Score:</span>
              <span className={`text-lg font-bold ${
                mockSuggestions.overall >= 80 ? "text-green-600" :
                mockSuggestions.overall >= 60 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {mockSuggestions.overall}
              </span>
            </div>
            
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Editor */}
        <div className="flex-1 p-6 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-73px)]">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className="text-xl font-semibold h-12"
              />
            </div>

            {/* Target Keyword */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Keyword</Label>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-slate-400" />
                  <Input value={content.targetKeyword} readOnly className="bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Word Count</Label>
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{content.wordCount} words</span>
                  <span className="text-xs text-slate-400">• {content.readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Meta Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Meta Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <span className={`text-xs ${
                      content.metaTitle.length > 60 ? "text-red-500" : "text-slate-500"
                    }`}>
                      {content.metaTitle.length}/60
                    </span>
                  </div>
                  <Input
                    id="metaTitle"
                    value={content.metaTitle}
                    onChange={(e) => setContent({ ...content, metaTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaDesc">Meta Description</Label>
                    <span className={`text-xs ${
                      content.metaDescription.length > 160 ? "text-red-500" : "text-slate-500"
                    }`}>
                      {content.metaDescription.length}/160
                    </span>
                  </div>
                  <Textarea
                    id="metaDesc"
                    value={content.metaDescription}
                    onChange={(e) => setContent({ ...content, metaDescription: e.target.value })}
                    rows={2}
                  />
                </div>
                
                {/* SERP Preview */}
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500 mb-2">Google Preview</p>
                  <div className="space-y-1">
                    <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer truncate">
                      {content.metaTitle || content.title}
                    </p>
                    <p className="text-green-700 dark:text-green-500 text-sm">
                      example.com › blog › ai-seo-tools
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {content.metaDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                <Button variant="outline" size="sm" onClick={handleOptimize} disabled={isOptimizing}>
                  {isOptimizing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  AI Optimize
                </Button>
              </div>
              <Textarea
                value={content.content}
                onChange={(e) => setContent({ ...content, content: e.target.value })}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Write your content here... (Markdown supported)"
              />
            </div>
          </div>
        </div>

        {/* Sidebar - SEO Suggestions */}
        <div className="w-96 p-6 bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-73px)] overflow-y-auto">
          <Tabs defaultValue="suggestions">
            <TabsList className="w-full">
              <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
              <TabsTrigger value="keywords" className="flex-1">Keywords</TabsTrigger>
              <TabsTrigger value="outline" className="flex-1">Outline</TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="mt-4 space-y-4">
              {/* Score Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${
                      mockSuggestions.overall >= 80 ? "text-green-600" :
                      mockSuggestions.overall >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {mockSuggestions.overall}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">SEO Score</p>
                    <Progress 
                      value={mockSuggestions.overall} 
                      className="mt-3 h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
                  Optimization Suggestions
                </h3>
                {mockSuggestions.suggestions.map((suggestion, i) => (
                  <Card key={i} className="cursor-pointer hover:border-cabbage-300 dark:hover:border-cabbage-700 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{suggestion.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{suggestion.current}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-cabbage-600">{suggestion.target}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="mt-4 space-y-4">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
                Keyword Usage
              </h3>
              {mockSuggestions.keywordUsage.map((kw, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{kw.keyword}</span>
                      <Badge variant="outline" className={getKeywordStatusColor(kw.status)}>
                        {kw.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(kw.count / kw.target.max) * 100} 
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {kw.count}/{kw.target.min}-{kw.target.max}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Target className="h-4 w-4" />
                    Add Secondary Keyword
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outline" className="mt-4 space-y-4">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">
                Content Outline
              </h3>
              <div className="space-y-2">
                {[
                  { level: 1, text: "The Complete Guide to AI SEO Tools in 2024" },
                  { level: 2, text: "Introduction" },
                  { level: 2, text: "What Are AI SEO Tools?" },
                  { level: 2, text: "Top AI SEO Tools for 2024" },
                  { level: 3, text: "1. CabbageSEO" },
                  { level: 3, text: "2. Surfer SEO" },
                  { level: 3, text: "3. Clearscope" },
                  { level: 2, text: "How to Choose the Right AI SEO Tool" },
                  { level: 2, text: "Conclusion" },
                  { level: 2, text: "FAQ" },
                ].map((heading, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      heading.level === 1 ? "font-bold" : 
                      heading.level === 2 ? "pl-4" : "pl-8 text-sm"
                    }`}
                  >
                    <Badge variant="outline" className="text-xs shrink-0">
                      H{heading.level}
                    </Badge>
                    <span className="truncate">{heading.text}</span>
                  </div>
                ))}
              </div>
              
              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Outline
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

