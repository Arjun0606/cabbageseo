"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Lock, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface SubscriptionStatus {
  hasSubscription: boolean;
  plan: string | null;
  loading: boolean;
}

// Features to show on the paywall
const FEATURES = [
  "AI-powered content generation",
  "Keyword research & tracking",
  "Technical SEO audits",
  "AI visibility optimization",
  "WordPress/Webflow publishing",
  "Priority support",
];

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasSubscription: false,
    plan: null,
    loading: true,
  });

  // Routes that should bypass the paywall (onboarding, settings for billing)
  const bypassRoutes = [
    "/onboarding",
    "/settings/billing",
  ];

  const shouldBypass = bypassRoutes.some(route => pathname?.startsWith(route));

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/billing/usage");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const plan = data.data?.plan?.id || data.data?.plan?.name || "free";
            const subscriptionStatus = data.data?.plan?.status;
            
            // Check if they have an active paid subscription
            const isPaid = plan !== "free" && 
              ["active", "trialing"].includes(subscriptionStatus || "");
            
            setStatus({
              hasSubscription: isPaid,
              plan: plan,
              loading: false,
            });
          } else {
            setStatus({ hasSubscription: false, plan: null, loading: false });
          }
        } else {
          setStatus({ hasSubscription: false, plan: null, loading: false });
        }
      } catch {
        setStatus({ hasSubscription: false, plan: null, loading: false });
      }
    }

    checkSubscription();
  }, []);

  // Show loading state
  if (status.loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access to bypass routes even without subscription
  if (shouldBypass) {
    return <>{children}</>;
  }

  // If no subscription, show paywall
  if (!status.hasSubscription) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-zinc-900 border-zinc-800">
          <CardContent className="p-8">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-full">
                <Lock className="w-12 h-12 text-emerald-500" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Unlock CabbageSEO
            </h1>
            <p className="text-zinc-400 text-center mb-8">
              Choose a plan to access the full SEO dashboard and start optimizing your site for AI search.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link href="/pricing" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Plans
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <div className="text-center">
                <p className="text-sm text-zinc-500">
                  Starting at <span className="text-emerald-400 font-semibold">$29/month</span>
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <Link href="/analyze" className="block">
                  <Button variant="ghost" className="w-full text-zinc-400 hover:text-white">
                    ← Try Free URL Analyzer Instead
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has subscription - render children
  return <>{children}</>;
}

