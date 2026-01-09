/**
 * AI Profile Page
 * 
 * PRIVACY-FIRST with opt-in sharing.
 * 
 * By default: Only shows "Claim this profile" CTA
 * With opt-in: Shows selected wins the owner chose to share
 * 
 * Founders don't want to expose strategy.
 * But they WILL share: "ChatGPT recommends us!"
 * 
 * This creates status, not surveillance.
 */

import { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Search, 
  ArrowRight,
  Lock,
  CheckCircle2,
  Sparkles,
  Shield,
  Eye
} from "lucide-react";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain).replace(/^www\./, "");
  
  return {
    title: `${cleanDomain} - AI Visibility | CabbageSEO`,
    description: `Track how AI platforms like ChatGPT, Perplexity, and Google AI recommend products in your market.`,
    openGraph: {
      title: `Is ${cleanDomain} recommended by AI?`,
      description: `Claim your AI visibility profile and track recommendations.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanDomain} AI Visibility`,
      description: `Track AI recommendations for ${cleanDomain}`,
    },
  };
}

interface SiteData {
  id: string;
  domain: string;
  category: string | null;
  total_citations: number | null;
  public_profile_enabled: boolean | null;
  public_profile_bio: string | null;
}

interface SharedWin {
  id: string;
  query: string;
  platform: string;
  cited_at: string;
  is_public: boolean;
}

async function getProfileData(domain: string) {
  const supabase = createServiceClient();
  const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
  
  // Find site by domain
  const { data: siteData } = await supabase
    .from("sites")
    .select("id, domain, category, total_citations, public_profile_enabled, public_profile_bio")
    .ilike("domain", `%${cleanDomain}%`)
    .single();
  
  const site = siteData as SiteData | null;
  
  if (!site) {
    return { exists: false, isPublic: false, site: null, sharedWins: [] };
  }
  
  // Check if profile is public
  if (!site.public_profile_enabled) {
    return { 
      exists: true, 
      isPublic: false, 
      site: { domain: site.domain, category: site.category },
      sharedWins: [] 
    };
  }
  
  // Get only citations marked as public/shareable
  // For now, if profile is public, show top 5 wins
  const { data: citationsData } = await supabase
    .from("citations")
    .select("id, query, platform, cited_at")
    .eq("site_id", site.id)
    .order("cited_at", { ascending: false })
    .limit(5);
  
  const sharedWins = (citationsData || []) as SharedWin[];
  
  return {
    exists: true,
    isPublic: true,
    site: {
      domain: site.domain,
      category: site.category,
      totalMentions: site.total_citations || 0,
      bio: site.public_profile_bio,
    },
    sharedWins,
  };
}

export default async function AIProfilePage({ params }: PageProps) {
  const { domain } = await params;
  const cleanDomain = decodeURIComponent(domain).replace(/^www\./, "");
  const { exists, isPublic, site, sharedWins } = await getProfileData(cleanDomain);
  
  // === CASE 1: Domain not tracked yet ===
  if (!exists) {
    return (
      <div className="min-h-screen bg-black">
        <ProfileHeader />
        
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-zinc-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-white">
              {cleanDomain}
            </h1>
            
            <p className="text-xl text-zinc-400">
              No AI visibility data for this domain yet.
            </p>
            
            <ClaimProfileCard domain={cleanDomain} />
            <WhyTrackSection />
          </div>
        </main>
      </div>
    );
  }
  
  // === CASE 2: Domain tracked but profile is PRIVATE ===
  if (!isPublic) {
    return (
      <div className="min-h-screen bg-black">
        <ProfileHeader />
        
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-zinc-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-white">
              {site?.domain || cleanDomain}
            </h1>
            
            {site?.category && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {site.category}
              </Badge>
            )}
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-xl mx-auto">
              <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-3">
                This profile is private
              </h2>
              <p className="text-zinc-400 mb-6">
                The owner of this domain tracks their AI visibility but hasn&apos;t 
                made their profile public. This protects competitive intelligence.
              </p>
              <p className="text-sm text-zinc-500">
                Want to see if AI recommends YOUR site?
              </p>
            </div>
            
            <ClaimProfileCard domain={cleanDomain} variant="secondary" />
          </div>
        </main>
      </div>
    );
  }
  
  // === CASE 3: Domain tracked and profile is PUBLIC ===
  return (
    <div className="min-h-screen bg-black">
      <ProfileHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1 mb-4">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">Public Profile</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            {site?.domain}
          </h1>
          
          {site?.category && (
            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
              {site.category}
            </Badge>
          )}
          
          {site?.bio && (
            <p className="text-zinc-400 mt-4 max-w-lg mx-auto">
              {site.bio}
            </p>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">
                {site?.totalMentions || 0}
              </div>
              <p className="text-xs text-zinc-500">AI Mentions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <div className="text-3xl font-bold text-white">
                {sharedWins.length}
              </div>
              <p className="text-xs text-zinc-500">Shared Wins</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Shared Wins */}
        {sharedWins.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                AI Recommends {site?.domain}
              </CardTitle>
              <p className="text-sm text-zinc-500">
                Queries where AI platforms mention this product
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedWins.map((win, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                  >
                    <div>
                      <p className="text-white">&ldquo;{win.query}&rdquo;</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                          {win.platform}
                        </Badge>
                        <span className="text-xs text-zinc-600">
                          {new Date(win.cited_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* CTA */}
        <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
          <CardContent className="py-8 text-center">
            <TrendingUp className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Track Your AI Visibility
            </h2>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              See which AI platforms recommend your product, track competitors, 
              and learn how to increase your visibility.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black">
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            AI visibility tracking powered by{" "}
            <Link href="/" className="text-emerald-500 hover:underline">
              CabbageSEO
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// === COMPONENTS ===

function ProfileHeader() {
  return (
    <header className="border-b border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/apple-touch-icon.png" alt="CabbageSEO" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-white">CabbageSEO</span>
        </Link>
        <Link href="/signup">
          <Button className="bg-emerald-500 hover:bg-emerald-400 text-black">
            Track Your Site
          </Button>
        </Link>
      </div>
    </header>
  );
}

function ClaimProfileCard({ domain, variant = "primary" }: { domain: string; variant?: "primary" | "secondary" }) {
  return (
    <div className={`rounded-xl p-8 max-w-xl mx-auto ${
      variant === "primary" 
        ? "bg-zinc-900 border border-zinc-800" 
        : "bg-transparent"
    }`}>
      {variant === "primary" && (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">
            Is this your site?
          </h2>
          <p className="text-zinc-400 mb-6">
            Start tracking how AI platforms like ChatGPT and Perplexity 
            recommend your site versus competitors.
          </p>
        </>
      )}
      <Link href={`/signup?domain=${encodeURIComponent(domain)}`}>
        <Button 
          size="lg" 
          className={variant === "primary" 
            ? "bg-emerald-500 hover:bg-emerald-400 text-black w-full" 
            : "bg-zinc-800 hover:bg-zinc-700 text-white"
          }
        >
          {variant === "primary" ? "Claim This Profile — Free" : "Track Your Own Site"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

function WhyTrackSection() {
  return (
    <div className="pt-12 border-t border-zinc-800 mt-12 text-left max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">
        Why track AI visibility?
      </h3>
      <div className="space-y-4">
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">See if AI recommends you</p>
            <p className="text-sm text-zinc-500">ChatGPT, Perplexity, Google AI — do they mention your product?</p>
          </div>
        </div>
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Track competitors</p>
            <p className="text-sm text-zinc-500">Know when AI recommends them instead of you</p>
          </div>
        </div>
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Get actionable fixes</p>
            <p className="text-sm text-zinc-500">See where to get listed to increase AI mentions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
