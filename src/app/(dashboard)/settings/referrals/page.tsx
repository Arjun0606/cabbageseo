"use client";

/**
 * ============================================
 * REFERRALS SETTINGS PAGE
 * ============================================
 *
 * Share your referral link, track invites,
 * and earn free months of CabbageSEO.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  Copy,
  Check,
  Users,
  UserPlus,
  Crown,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSite } from "@/context/site-context";

interface ReferralData {
  referralCode: string | null;
  referralUrl: string | null;
  stats: {
    totalReferred: number;
    signedUp: number;
    converted: number;
    rewardsEarned: number;
  };
  referrals: {
    id: string;
    status: string;
    reward_applied: boolean;
    referred_email: string | null;
    created_at: string;
  }[];
}

export default function ReferralsPage() {
  const { organization, loading: siteLoading } = useSite();

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/referrals", { method: "POST" });
      if (res.ok) {
        await fetchReferralData();
      }
    } catch (err) {
      console.error("Failed to generate referral code:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!data?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed_up":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">
            Signed Up
          </span>
        );
      case "converted":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400">
            Converted
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-500/10 text-zinc-400">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400">
            Pending
          </span>
        );
    }
  };

  if (siteLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading referral data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Gift className="w-8 h-8 text-emerald-400" />
            Referral Program
          </h1>
          <p className="text-xl text-zinc-400 mt-2">
            Invite friends and earn free months of CabbageSEO
          </p>
        </div>

        {/* How It Works */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">How it works</CardTitle>
            <CardDescription>
              Three simple steps to earn free months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Copy className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-medium text-white mb-1">1. Share your link</h3>
                <p className="text-sm text-zinc-500">
                  Copy your unique referral link and share it with friends
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-medium text-white mb-1">2. They get 14 days</h3>
                <p className="text-sm text-zinc-500">
                  Your friend gets 20% off their first month
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-medium text-white mb-1">3. You get 1 month free</h3>
                <p className="text-sm text-zinc-500">
                  When they convert to a paid plan, you get a free month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Your Referral Link</CardTitle>
            <CardDescription>
              Share this link with friends to start earning rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.referralCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-sm truncate">
                  {data.referralUrl}
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-400 mb-4">
                  Generate your unique referral code to start inviting friends
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Generate Referral Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {data?.stats.totalReferred || 0}
              </p>
              <p className="text-sm text-zinc-500">Invited</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {data?.stats.signedUp || 0}
              </p>
              <p className="text-sm text-zinc-500">Signed Up</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6 text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {data?.stats.rewardsEarned || 0}
              </p>
              <p className="text-sm text-zinc-500">Rewards Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Referrals */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Referrals</CardTitle>
            <CardDescription>
              Track the status of your referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.referrals || data.referrals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">
                  No referrals yet. Share your link to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">
                        {referral.referred_email || "Anonymous"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(referral.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
