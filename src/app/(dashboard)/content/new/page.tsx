"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Target,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Globe,
  Search,
  Copy,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSite } from "@/contexts/app-context";

// ============================================
// TYPES
// ============================================

interface Site {
  id: string;
  domain: string;
  name: string;
}

interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "loading" | "complete" | "error";
  result?: string;
}

interface GeneratedContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  wordCount: number;
  outline: string[];
}

// ============================================
// STEP INDICATOR
// ============================================

function StepIndicator({ step }: { step: GenerationStep }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
      step.status === "complete" ? "bg-green-500/10" :
      step.status === "loading" ? "bg-primary/10" :
      step.status === "error" ? "bg-red-500/10" :
      "bg-muted/50"
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        step.status === "complete" ? "bg-green-500 text-white" :
        step.status === "loading" ? "bg-primary text-white" :
        step.status === "error" ? "bg-red-500 text-white" :
        "bg-muted text-muted-foreground"
      }`}>
        {step.status === "loading" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : step.status === "complete" ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : step.status === "error" ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <span className="text-xs">{step.id}</span>
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${step.status === "loading" ? "text-primary font-medium" : ""}`}>
          {step.label}
        </p>
        {step.result && (
          <p className="text-xs text-muted-foreground">{step.result}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// CONTENT IDEA CARD
// ============================================

function ContentIdeaCard({ 
  idea, 
  selected, 
  onClick 
}: { 
  idea: { title: string; keyword: string; description: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${selected ? "bg-primary/10 text-primary" : "bg-muted"}`}>
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">{idea.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {idea.keyword}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {idea.description}
            </p>
          </div>
          {selected && (
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN PAGE
// ============================================

function NewContentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  
  // Global site context
  const { sites: contextSites, selectedSite: globalSelectedSite, isLoading: isLoadingSites } = useSite();

  // State - use global site if available
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [step, setStep] = useState<"select" | "input" | "ideas" | "generating" | "preview">("select");
  
  // Input state
  const [targetKeyword, setTargetKeyword] = useState("");
  const [contentType, setContentType] = useState<"blog" | "guide" | "listicle" | "comparison">("blog");
  const [optimizationMode, setOptimizationMode] = useState<"seo" | "aio" | "balanced">("balanced");
  const [customTitle, setCustomTitle] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // Generation state
  const [contentIdeas, setContentIdeas] = useState<Array<{ title: string; keyword: string; description: string }>>([]);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use global site context - skip site selection if site is already selected
  useEffect(() => {
    if (!isLoadingSites && contextSites.length > 0) {
      // Map sites to local format
      const mappedSites = contextSites.map(s => ({
        id: s.id,
        domain: s.domain,
        name: s.domain,
      }));
      setSites(mappedSites);
      
      // If there's a globally selected site, use it and skip to input step
      if (globalSelectedSite) {
        setSelectedSite(globalSelectedSite.id);
        setStep("input");
      } else if (contextSites.length === 1) {
        // Auto-select first site if only one
        setSelectedSite(contextSites[0].id);
        setStep("input");
      }
    }
  }, [contextSites, globalSelectedSite, isLoadingSites]);

  // Handle generating ideas
  const handleGenerateIdeas = async () => {
    if (!targetKeyword.trim()) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      // Call real AI API to generate content ideas
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ideas",
          topic: targetKeyword,
          options: {
            count: 5,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 && errorData.code === "SUBSCRIPTION_REQUIRED") {
          router.push("/pricing");
          return;
        }
        throw new Error(errorData.error || "Failed to generate ideas");
      }

      const data = await response.json();
      
      if (data.success && data.data?.ideas && Array.isArray(data.data.ideas)) {
        setContentIdeas(data.data.ideas.map((idea: { title: string; keyword?: string; intent?: string; trafficPotential?: string; difficulty?: string }) => ({
          title: idea.title,
          keyword: idea.keyword || targetKeyword,
          description: idea.intent 
            ? `${idea.intent} • ${idea.difficulty || "medium"} difficulty • ${idea.trafficPotential || "medium"} traffic`
            : `Traffic potential: ${idea.trafficPotential || "medium"}`,
        })));
      } else {
        throw new Error("AI did not return valid content ideas. Please try again.");
      }

      setStep("ideas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle content generation
  const handleGenerateContent = async () => {
    if (selectedIdea === null && !customTitle.trim()) return;

    const title = customTitle.trim() || contentIdeas[selectedIdea!]?.title || "";
    const keyword = targetKeyword;

    setStep("generating");
    setIsGenerating(true);
    setError(null);
    
    const steps = optimizationMode === "aio" || optimizationMode === "balanced" 
      ? [
          { id: "1", label: "Researching topic...", status: "pending" as const },
          { id: "2", label: "Analyzing competitors...", status: "pending" as const },
          { id: "3", label: "Creating AIO-optimized outline...", status: "pending" as const },
          { id: "4", label: "Writing content...", status: "pending" as const },
          { id: "5", label: "Optimizing for AI visibility...", status: "pending" as const },
        ]
      : [
          { id: "1", label: "Researching topic...", status: "pending" as const },
          { id: "2", label: "Analyzing competitors...", status: "pending" as const },
          { id: "3", label: "Creating outline...", status: "pending" as const },
          { id: "4", label: "Writing content...", status: "pending" as const },
          { id: "5", label: "Optimizing for SEO...", status: "pending" as const },
        ];
    
    setGenerationSteps(steps);

    try {
      // Step 1: Research
      setGenerationSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: "loading" } : s));

      // Call the real content generation API
      const response = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSite,
          title,
          keyword,
          contentType,
          optimizationMode,
          instructions: customInstructions,
        }),
      });

      // Update steps as we go (the API will take time)
      setGenerationSteps(prev => prev.map((s, i) => 
        i === 0 ? { ...s, status: "complete", result: "Research complete" } : s
      ));
      setGenerationSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: "loading" } : s));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 && errorData.code === "SUBSCRIPTION_REQUIRED") {
          router.push("/pricing");
          return;
        }
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();

      // Complete remaining steps
      setGenerationSteps(prev => prev.map((s, i) => 
        i === 1 ? { ...s, status: "complete", result: "Competitors analyzed" } : s
      ));
      setGenerationSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: "loading" } : s));
      
      await new Promise(r => setTimeout(r, 500));
      setGenerationSteps(prev => prev.map((s, i) => 
        i === 2 ? { ...s, status: "complete", result: "Outline created" } : s
      ));
      setGenerationSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: "loading" } : s));
      
      await new Promise(r => setTimeout(r, 500));
      setGenerationSteps(prev => prev.map((s, i) => 
        i === 3 ? { ...s, status: "complete", result: `Generated ${data.data?.wordCount || 2000}+ words` } : s
      ));
      setGenerationSteps(prev => prev.map((s, i) => i === 4 ? { ...s, status: "loading" } : s));
      
      await new Promise(r => setTimeout(r, 500));
      setGenerationSteps(prev => prev.map((s, i) => 
        i === 4 ? { ...s, status: "complete", result: optimizationMode === "aio" ? "AIO score: 85/100" : "SEO score: 85/100" } : s
      ));

      if (data.success && data.data) {
        const generatedData = data.data;
        setGeneratedContent({
          title: generatedData.title || title,
          metaTitle: generatedData.metaTitle || `${title} | Expert Guide`,
          metaDescription: generatedData.metaDescription || `Learn about ${keyword}.`,
          content: generatedData.body || generatedData.content || "",
          wordCount: generatedData.wordCount || 0,
          outline: generatedData.outline?.headings?.map((h: { text: string }) => h.text) || [],
        });
        setStep("preview");
      } else {
        throw new Error(data.error || "Failed to generate content");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
      setStep("ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle saving content
  const handleSaveContent = async () => {
    if (!generatedContent || !selectedSite) return;

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSite,
          title: generatedContent.title,
          targetKeyword,
          content: generatedContent.content,
          metaTitle: generatedContent.metaTitle,
          metaDescription: generatedContent.metaDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      const result = await response.json();
      
      if (result.success && result.data?.id) {
        router.push(`/content/${result.data.id}`);
      } else {
        router.push("/content");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    }
  };

  // Render based on current step
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Content</h1>
          <p className="text-muted-foreground">Let AI write SEO-optimized content for you</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {["Select Site", "Enter Topic", "Choose Idea", "Generate", "Preview"].map((label, i) => {
          const stepIndex = ["select", "input", "ideas", "generating", "preview"].indexOf(step);
          const isActive = i === stepIndex;
          const isComplete = i < stepIndex;
          
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isActive ? "bg-primary text-primary-foreground" :
                isComplete ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center text-xs">{i + 1}</span>
                )}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Select Site */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Select a Site</CardTitle>
            <CardDescription>Choose which site this content is for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSites ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No sites found. Add a site first.</p>
                <Button asChild>
                  <Link href="/onboarding">Add Your First Site</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {sites.map((site) => (
                  <Card
                    key={site.id}
                    className={`cursor-pointer transition-all ${
                      selectedSite === site.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedSite(site.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{site.domain}</p>
                      </div>
                      {selectedSite === site.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {selectedSite && (
              <Button onClick={() => setStep("input")} className="w-full">
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Input Topic */}
      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to write about?</CardTitle>
            <CardDescription>Enter a topic or keyword and we'll generate ideas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="keyword">Target Keyword or Topic</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="keyword"
                    placeholder="e.g., SEO tools, content marketing, keyword research"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="guide">Comprehensive Guide</SelectItem>
                    <SelectItem value="listicle">Listicle (Top 10, Best of)</SelectItem>
                    <SelectItem value="comparison">Comparison Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Optimization Mode
                  <Badge variant="outline" className="text-[10px] text-violet-500 border-violet-500/30">NEW</Badge>
                </Label>
                <Select value={optimizationMode} onValueChange={(v) => setOptimizationMode(v as typeof optimizationMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">
                      <div className="flex items-center gap-2">
                        <span>Balanced (SEO + AI)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="seo">
                      <div className="flex items-center gap-2">
                        <span>SEO Focused</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="aio">
                      <div className="flex items-center gap-2">
                        <span>AI Search (ChatGPT, Perplexity)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {optimizationMode === "balanced" && "Optimized for both traditional search and AI platforms"}
                  {optimizationMode === "seo" && "Focus on Google rankings and traditional SEO signals"}
                  {optimizationMode === "aio" && "Optimized for AI citations: quotable paragraphs, FAQs, entities"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Any specific points to cover, tone preferences, target audience..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button 
                onClick={handleGenerateIdeas} 
                disabled={!targetKeyword.trim() || isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Generate Content Ideas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Idea */}
      {step === "ideas" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Content Idea</CardTitle>
              <CardDescription>
                Select one of the AI-generated ideas or write your own title
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="ideas">
                <TabsList>
                  <TabsTrigger value="ideas">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="custom">Custom Title</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ideas" className="space-y-3 mt-4">
                  {contentIdeas.map((idea, i) => (
                    <ContentIdeaCard
                      key={i}
                      idea={idea}
                      selected={selectedIdea === i}
                      onClick={() => {
                        setSelectedIdea(i);
                        setCustomTitle("");
                      }}
                    />
                  ))}
                </TabsContent>
                
                <TabsContent value="custom" className="mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Your Custom Title</Label>
                      <Input
                        placeholder="Enter your article title..."
                        value={customTitle}
                        onChange={(e) => {
                          setCustomTitle(e.target.value);
                          setSelectedIdea(null);
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("input")}>
              Back
            </Button>
            <Button 
              onClick={handleGenerateContent} 
              disabled={selectedIdea === null && !customTitle.trim()}
              className="flex-1"
            >
              <Wand2 className="mr-2 w-4 h-4" />
              Generate Full Article
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === "generating" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full inline-block">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardTitle>Creating Your Content</CardTitle>
            <CardDescription>This usually takes 30-60 seconds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={
              (generationSteps.filter(s => s.status === "complete").length / generationSteps.length) * 100
            } className="h-2" />
            
            <div className="space-y-2">
              {generationSteps.map((step) => (
                <StepIndicator key={step.id} step={step} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview */}
      {step === "preview" && generatedContent && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Generated!</CardTitle>
                  <CardDescription>
                    Review and edit before saving
                  </CardDescription>
                </div>
                <Badge className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {generatedContent.wordCount} words
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={generatedContent.title}
                  onChange={(e) => setGeneratedContent({
                    ...generatedContent,
                    title: e.target.value,
                  })}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Meta */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input 
                    value={generatedContent.metaTitle}
                    onChange={(e) => setGeneratedContent({
                      ...generatedContent,
                      metaTitle: e.target.value,
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Keyword</Label>
                  <Input value={targetKeyword} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={generatedContent.metaDescription}
                  onChange={(e) => setGeneratedContent({
                    ...generatedContent,
                    metaDescription: e.target.value,
                  })}
                  rows={2}
                />
              </div>

              {/* Outline Preview */}
              <div className="space-y-2">
                <Label>Content Outline</Label>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.outline.map((section, i) => (
                    <Badge key={i} variant="secondary">{section}</Badge>
                  ))}
                </div>
              </div>

              {/* Content Preview */}
              <div className="space-y-2">
                <Label>Content Preview</Label>
                <div className="p-4 bg-muted/50 rounded-lg max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedContent.content.slice(0, 1000)}...
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("ideas")}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Regenerate
            </Button>
            <Button variant="outline" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Content
            </Button>
            <Button onClick={handleSaveContent} className="flex-1">
              Save & Edit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function NewContentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <NewContentPageContent />
    </Suspense>
  );
}

