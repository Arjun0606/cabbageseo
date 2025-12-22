"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone, Globe, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NotificationSettings {
  email: {
    weeklyReport: boolean;
    rankingChanges: boolean;
    contentPublished: boolean;
    auditComplete: boolean;
    usageAlerts: boolean;
  };
  push: {
    enabled: boolean;
    urgentOnly: boolean;
  };
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      weeklyReport: true,
      rankingChanges: true,
      contentPublished: true,
      auditComplete: true,
      usageAlerts: true,
    },
    push: {
      enabled: false,
      urgentOnly: true,
    },
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save to API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="w-5 h-5 text-emerald-500" />
            Email Notifications
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Choose what emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-report" className="text-zinc-200">Weekly Report</Label>
              <p className="text-xs text-zinc-500">
                Get a summary of your SEO performance every week
              </p>
            </div>
            <Switch
              id="weekly-report"
              checked={settings.email.weeklyReport}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, email: { ...s.email, weeklyReport: checked } }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ranking-changes" className="text-zinc-200">Ranking Changes</Label>
              <p className="text-xs text-zinc-500">
                Get notified when your keywords move significantly
              </p>
            </div>
            <Switch
              id="ranking-changes"
              checked={settings.email.rankingChanges}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, email: { ...s.email, rankingChanges: checked } }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="content-published" className="text-zinc-200">Content Published</Label>
              <p className="text-xs text-zinc-500">
                Confirmation when content is published to your CMS
              </p>
            </div>
            <Switch
              id="content-published"
              checked={settings.email.contentPublished}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, email: { ...s.email, contentPublished: checked } }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-complete" className="text-zinc-200">Audit Complete</Label>
              <p className="text-xs text-zinc-500">
                Get notified when site audits finish running
              </p>
            </div>
            <Switch
              id="audit-complete"
              checked={settings.email.auditComplete}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, email: { ...s.email, auditComplete: checked } }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="usage-alerts" className="text-zinc-200">Usage Alerts</Label>
              <p className="text-xs text-zinc-500">
                Get notified when you're approaching usage limits
              </p>
            </div>
            <Switch
              id="usage-alerts"
              checked={settings.email.usageAlerts}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, email: { ...s.email, usageAlerts: checked } }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Smartphone className="w-5 h-5 text-emerald-500" />
            Push Notifications
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Browser push notifications (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label htmlFor="push-enabled" className="text-zinc-200">Enable Push Notifications</Label>
              <p className="text-xs text-zinc-500">
                Receive notifications in your browser
              </p>
            </div>
            <Switch
              id="push-enabled"
              disabled
              checked={settings.push.enabled}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, push: { ...s.push, enabled: checked } }))
              }
            />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label htmlFor="urgent-only" className="text-zinc-200">Urgent Only</Label>
              <p className="text-xs text-zinc-500">
                Only receive notifications for critical alerts
              </p>
            </div>
            <Switch
              id="urgent-only"
              disabled
              checked={settings.push.urgentOnly}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, push: { ...s.push, urgentOnly: checked } }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}

