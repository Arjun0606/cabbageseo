"use client";

/**
 * ============================================
 * NOTIFICATIONS SETTINGS - Alert Preferences
 * ============================================
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSite } from "@/context/site-context";

interface NotificationSettings {
  citationAlerts: boolean;
  weeklyReport: boolean;
  competitorAlerts: boolean;
  productUpdates: boolean;
}

export default function NotificationsPage() {
  const { user, loading: siteLoading } = useSite();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    citationAlerts: true,
    weeklyReport: true,
    competitorAlerts: true,
    productUpdates: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load notification settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, []);

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    setSaving(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    } finally {
      setSaving(false);
    }
  };

  if (siteLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-zinc-500 text-sm">Manage your email alerts</p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>

      {/* Email Info */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800">
              <Mail className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Notifications sent to</p>
              <p className="text-white font-medium">{user?.email || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citation Alerts */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Citation Alerts
          </CardTitle>
          <CardDescription>Get notified about AI citations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="citation-alerts" className="text-white font-medium">
                New Citation Alerts
              </Label>
              <p className="text-sm text-zinc-500 mt-0.5">
                Get emailed when AI platforms cite your website
              </p>
            </div>
            <Switch
              id="citation-alerts"
              checked={settings.citationAlerts}
              onCheckedChange={() => handleToggle("citationAlerts")}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="competitor-alerts" className="text-white font-medium">
                Competitor Alerts
              </Label>
              <p className="text-sm text-zinc-500 mt-0.5">
                Get notified when competitors gain citations
              </p>
            </div>
            <Switch
              id="competitor-alerts"
              checked={settings.competitorAlerts}
              onCheckedChange={() => handleToggle("competitorAlerts")}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-report" className="text-white font-medium">
                Weekly Report
              </Label>
              <p className="text-sm text-zinc-500 mt-0.5">
                Receive a weekly summary of your AI visibility
              </p>
            </div>
            <Switch
              id="weekly-report"
              checked={settings.weeklyReport}
              onCheckedChange={() => handleToggle("weeklyReport")}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Updates */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Product Updates</CardTitle>
          <CardDescription>Stay informed about CabbageSEO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product-updates" className="text-white font-medium">
                Product News
              </Label>
              <p className="text-sm text-zinc-500 mt-0.5">
                New features, tips, and updates
              </p>
            </div>
            <Switch
              id="product-updates"
              checked={settings.productUpdates}
              onCheckedChange={() => handleToggle("productUpdates")}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Back Link */}
      <Link href="/settings">
        <Button variant="ghost" className="text-zinc-400">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      </Link>
    </div>
  );
}
