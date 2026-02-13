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
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSite } from "@/context/site-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CustomQueries } from "@/components/dashboard/custom-queries";
import { getCitationPlanLimits } from "@/lib/billing/citation-plans";

const settingsNav = [
  { href: "/settings/billing", label: "Billing", icon: CreditCard, description: "Subscription & invoices" },
  { href: "/settings/notifications", label: "Notifications", icon: Mail, description: "Email & alert preferences" },
];

export default function SettingsPage() {
  const { user, organization, sites, currentSite, loading, deleteSite } = useSite();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [deletingSite, setDeletingSite] = useState<string | null>(null);
  const [deleteConfirmSite, setDeleteConfirmSite] = useState<string | null>(null);
  const [customQueries, setCustomQueries] = useState<string[]>([]);

  const plan = organization?.plan || "free";
  const planLimits = getCitationPlanLimits(plan);
  const maxCustomQueries = planLimits.customQueriesPerSite;

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (currentSite) {
      setCustomQueries(currentSite.customQueries || []);
    }
  }, [currentSite]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    setDeletingSite(siteId);
    await deleteSite(siteId);
    setDeletingSite(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              {saveStatus === "saved" && (
                <span className="text-sm text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-sm text-red-400">Failed to save</span>
              )}
            </div>
          </div>
          
          <div>
            <Label className="text-zinc-400">Plan</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={
                organization?.plan && organization.plan !== "free"
                  ? "bg-emerald-500/10 text-emerald-400 border-0"
                  : "bg-zinc-800 text-zinc-400 border-0"
              }>
                {!organization?.plan || organization.plan === "free"
                  ? "No plan"
                  : `${organization.plan.charAt(0).toUpperCase()}${organization.plan.slice(1)}`}
              </Badge>
              {(!organization?.plan || organization.plan === "free") ? (
                <Link href="/settings/billing" className="text-sm text-emerald-400 hover:underline">
                  Subscribe
                </Link>
              ) : organization.plan !== "dominate" ? (
                <Link href="/settings/billing" className="text-sm text-emerald-400 hover:underline">
                  Upgrade
                </Link>
              ) : null}
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
                    onClick={() => setDeleteConfirmSite(site.id)}
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

      {/* Custom Query Tracking */}
      {currentSite && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Custom Query Tracking</CardTitle>
            <CardDescription>Track specific AI queries for your site</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomQueries
              siteId={currentSite.id}
              queries={customQueries}
              maxQueries={maxCustomQueries}
              onUpdate={setCustomQueries}
            />
          </CardContent>
        </Card>
      )}

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
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            {loggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteConfirmSite}
        onConfirm={() => deleteConfirmSite && handleDeleteSite(deleteConfirmSite)}
        onCancel={() => setDeleteConfirmSite(null)}
        title="Delete this site?"
        description="All citations, history, and generated pages for this site will be permanently lost."
        confirmLabel="Delete Site"
        variant="destructive"
      />
    </div>
  );
}
