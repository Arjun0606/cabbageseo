"use client";

/**
 * ============================================
 * SETTINGS PAGE - Account & Preferences
 * ============================================
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  CreditCard,
  Shield,
  ChevronRight,
  Loader2,
  Trash2,
  LogOut,
  Globe,
  Mail,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSite } from "@/context/site-context";

const settingsNav = [
  { href: "/settings/billing", label: "Billing", icon: CreditCard, description: "Subscription & invoices" },
  { href: "/settings/referrals", label: "Referrals", icon: Gift, description: "Earn free months" },
];

export default function SettingsPage() {
  const { user, organization, sites, loading, deleteSite } = useSite();
  
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingSite, setDeletingSite] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm("Are you sure you want to delete this site? All citations will be lost.")) return;
    
    setDeletingSite(siteId);
    await deleteSite(siteId);
    setDeletingSite(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-xl text-zinc-400">Manage your account and preferences</p>
        </div>

      {/* Quick Nav */}
      <div className="grid sm:grid-cols-2 gap-4">
        {settingsNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer h-full">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-zinc-800">
                    <Icon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{item.label}</h3>
                    <p className="text-sm text-zinc-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Account Info */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-400" />
            Account
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-zinc-400">Email</Label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-zinc-600" />
              <span className="text-white">{user?.email || "—"}</span>
            </div>
          </div>
          
          <div>
            <Label htmlFor="name" className="text-zinc-400">Display Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-xs bg-zinc-800 border-zinc-700"
              />
              <Button 
                onClick={handleSave} 
                disabled={saving || name === user?.name}
                variant="outline"
                className="border-zinc-700"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-zinc-400">Plan</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={
                organization?.plan === "command" || organization?.plan === "dominate" ? "bg-emerald-500/10 text-emerald-400 border-0" :
                organization?.plan === "scout" ? "bg-blue-500/10 text-blue-400 border-0" :
                "bg-zinc-800 text-zinc-400 border-0"
              }>
                {organization?.plan || "free"} {organization?.plan === "free" ? "trial" : "plan"}
              </Badge>
              {organization?.plan !== "pro" && (
                <Link href="/pricing" className="text-sm text-emerald-400 hover:underline">
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracked Sites */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-zinc-400" />
            Tracked Websites
          </CardTitle>
          <CardDescription>Manage your tracked domains</CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-zinc-500 text-sm">No websites added yet.</p>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{site.domain}</p>
                      <p className="text-xs text-zinc-500">{site.totalCitations} citations</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSite(site.id)}
                    disabled={deletingSite === site.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {deletingSite === site.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-zinc-900/50 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Sign out</p>
            <p className="text-sm text-zinc-500">Sign out of your account</p>
          </div>
          <Link href="/api/auth/logout">
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </Link>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
